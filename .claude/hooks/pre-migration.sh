#!/bin/bash

# Migration Safety Hook
# Validates and backs up database before running migrations

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MIGRATION_FILE="${1:-}"
BACKUP_DIR="$PROJECT_DIR/.claude/db-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ERRORS=0
WARNINGS=0

# Function to print colored status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_header() {
    echo -e "\n${BOLD}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

print_header "🛡️ MIGRATION SAFETY CHECK"

# Function to check Supabase availability
check_supabase() {
    print_header "🔌 Checking Supabase Connection"
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI not found"
        print_info "Install with: npm install -g supabase"
        return 1
    fi
    
    cd "$PROJECT_DIR"
    
    # Check Supabase status
    if supabase status > /dev/null 2>&1; then
        print_status "Supabase connection verified"
        
        # Get database info
        DB_STATUS=$(supabase status 2>/dev/null | grep -E "(API URL|Database URL)" | head -2)
        if [ -n "$DB_STATUS" ]; then
            echo "$DB_STATUS" | while read -r line; do
                print_info "  └─ $line"
            done
        fi
        return 0
    else
        print_error "Cannot connect to Supabase"
        print_info "Run: supabase start"
        return 1
    fi
}

# Function to validate migration SQL
validate_migration() {
    local MIGRATION_PATH="$1"
    
    print_header "📝 Validating Migration File"
    
    if [ ! -f "$MIGRATION_PATH" ]; then
        # Check default migrations directory
        MIGRATION_PATH="$PROJECT_DIR/supabase/migrations/$MIGRATION_FILE"
        if [ ! -f "$MIGRATION_PATH" ]; then
            print_error "Migration file not found: $MIGRATION_FILE"
            return 1
        fi
    fi
    
    print_info "Checking: $(basename "$MIGRATION_PATH")"
    
    # Check for dangerous operations
    DANGEROUS_OPS=0
    
    # Check for DROP operations
    if grep -qiE "DROP\s+(TABLE|DATABASE|SCHEMA|COLUMN)" "$MIGRATION_PATH"; then
        print_warning "Contains DROP operations - data will be lost!"
        ((DANGEROUS_OPS++))
        
        # Show what will be dropped
        grep -iE "DROP\s+(TABLE|DATABASE|SCHEMA|COLUMN)" "$MIGRATION_PATH" | while read -r line; do
            print_info "  └─ $line"
        done
    fi
    
    # Check for DELETE without WHERE
    if grep -qiE "DELETE\s+FROM\s+\w+\s*;" "$MIGRATION_PATH"; then
        print_error "DELETE without WHERE clause detected - will delete all rows!"
        ((DANGEROUS_OPS++))
    fi
    
    # Check for TRUNCATE
    if grep -qiE "TRUNCATE" "$MIGRATION_PATH"; then
        print_warning "TRUNCATE operation detected - will remove all data!"
        ((DANGEROUS_OPS++))
    fi
    
    # Check for ALTER TABLE operations
    if grep -qiE "ALTER\s+TABLE" "$MIGRATION_PATH"; then
        print_info "Schema changes detected (ALTER TABLE)"
        
        # Check for column drops
        if grep -qiE "DROP\s+COLUMN" "$MIGRATION_PATH"; then
            print_warning "Columns will be dropped - data will be lost"
        fi
        
        # Check for type changes
        if grep -qiE "ALTER\s+COLUMN.*TYPE" "$MIGRATION_PATH"; then
            print_warning "Column type changes detected - may cause data loss"
        fi
    fi
    
    # Check for missing IF EXISTS clauses
    if grep -qiE "CREATE\s+(TABLE|INDEX|FUNCTION)" "$MIGRATION_PATH"; then
        if ! grep -qiE "IF\s+NOT\s+EXISTS" "$MIGRATION_PATH"; then
            print_warning "CREATE statements without IF NOT EXISTS"
            print_info "Migration may fail if objects already exist"
        fi
    fi
    
    # Check for RLS policies on new tables
    if grep -qiE "CREATE\s+TABLE" "$MIGRATION_PATH"; then
        TABLE_COUNT=$(grep -ciE "CREATE\s+TABLE" "$MIGRATION_PATH")
        POLICY_COUNT=$(grep -ciE "CREATE\s+POLICY" "$MIGRATION_PATH")
        
        if [ $POLICY_COUNT -eq 0 ]; then
            print_warning "New tables without RLS policies detected"
            print_info "Remember to add Row Level Security policies"
        else
            print_status "RLS policies found: $POLICY_COUNT"
        fi
    fi
    
    # Check SQL syntax basics
    if ! tail -1 "$MIGRATION_PATH" | grep -qE ";$"; then
        print_error "Missing semicolon at end of file"
    fi
    
    # Count total statements
    STATEMENT_COUNT=$(grep -c ";" "$MIGRATION_PATH" 2>/dev/null || echo 0)
    print_info "Total SQL statements: $STATEMENT_COUNT"
    
    if [ $DANGEROUS_OPS -gt 0 ]; then
        print_warning "Migration contains $DANGEROUS_OPS dangerous operations"
        return 1
    else
        print_status "Migration validation passed"
        return 0
    fi
}

# Function to backup database schema
backup_schema() {
    print_header "💾 Creating Schema Backup"
    
    cd "$PROJECT_DIR"
    
    # Use Supabase to dump schema
    SCHEMA_BACKUP="$BACKUP_DIR/schema_${TIMESTAMP}.sql"
    
    print_info "Generating schema backup..."
    
    # Try to dump schema using Supabase
    if command -v pg_dump &> /dev/null; then
        # Get database URL from Supabase
        DB_URL=$(supabase status 2>/dev/null | grep "Database URL" | awk '{print $3}')
        
        if [ -n "$DB_URL" ]; then
            pg_dump --schema-only "$DB_URL" > "$SCHEMA_BACKUP" 2>/dev/null
            
            if [ -f "$SCHEMA_BACKUP" ] && [ -s "$SCHEMA_BACKUP" ]; then
                BACKUP_SIZE=$(wc -c < "$SCHEMA_BACKUP" | xargs)
                print_status "Schema backup created: schema_${TIMESTAMP}.sql (${BACKUP_SIZE} bytes)"
            else
                print_warning "Schema backup failed - pg_dump issue"
            fi
        else
            print_warning "Could not get database URL"
        fi
    else
        print_warning "pg_dump not available - using migration history"
        
        # Fallback: Copy existing migrations as backup
        if [ -d "$PROJECT_DIR/supabase/migrations" ]; then
            cp -r "$PROJECT_DIR/supabase/migrations" "$BACKUP_DIR/migrations_${TIMESTAMP}"
            print_status "Migration history backed up"
        fi
    fi
}

# Function to generate rollback script
generate_rollback() {
    local MIGRATION_PATH="$1"
    
    print_header "↩️ Generating Rollback Script"
    
    ROLLBACK_FILE="$BACKUP_DIR/rollback_${TIMESTAMP}.sql"
    
    echo "-- Rollback script generated $(date '+%Y-%m-%d %H:%M:%S')" > "$ROLLBACK_FILE"
    echo "-- For migration: $(basename "$MIGRATION_PATH")" >> "$ROLLBACK_FILE"
    echo "" >> "$ROLLBACK_FILE"
    
    # Parse migration and generate reverse operations
    while IFS= read -r line; do
        # Generate rollback for CREATE TABLE
        if echo "$line" | grep -qiE "CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)"; then
            TABLE_NAME=$(echo "$line" | sed -E 's/.*CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z_][a-zA-Z0-9_]*).*/\1/i')
            echo "DROP TABLE IF EXISTS $TABLE_NAME CASCADE;" >> "$ROLLBACK_FILE"
        elif echo "$line" | grep -qiE "CREATE\s+TABLE\s+(\w+)"; then
            TABLE_NAME=$(echo "$line" | sed -E 's/.*CREATE\s+TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*).*/\1/i')
            echo "DROP TABLE IF EXISTS $TABLE_NAME CASCADE;" >> "$ROLLBACK_FILE"
        fi
        
        # Generate rollback for CREATE INDEX
        if echo "$line" | grep -qiE "CREATE\s+INDEX\s+(\w+)"; then
            INDEX_NAME=$(echo "$line" | sed -E 's/.*CREATE\s+INDEX\s+([a-zA-Z_][a-zA-Z0-9_]*).*/\1/i')
            echo "DROP INDEX IF EXISTS $INDEX_NAME;" >> "$ROLLBACK_FILE"
        fi
        
        # Generate rollback for ALTER TABLE ADD COLUMN
        if echo "$line" | grep -qiE "ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)"; then
            TABLE_NAME=$(echo "$line" | sed -E 's/.*ALTER\s+TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*).*/\1/i')
            COLUMN_NAME=$(echo "$line" | sed -E 's/.*ADD\s+COLUMN\s+([a-zA-Z_][a-zA-Z0-9_]*).*/\1/i')
            echo "ALTER TABLE $TABLE_NAME DROP COLUMN IF EXISTS $COLUMN_NAME;" >> "$ROLLBACK_FILE"
        fi
        
    done < "$MIGRATION_PATH"
    
    if [ -f "$ROLLBACK_FILE" ] && [ -s "$ROLLBACK_FILE" ]; then
        ROLLBACK_SIZE=$(wc -c < "$ROLLBACK_FILE" | xargs)
        print_status "Rollback script generated: rollback_${TIMESTAMP}.sql"
        print_info "  └─ Use this if migration fails: $ROLLBACK_FILE"
    else
        print_warning "Could not generate automatic rollback script"
        print_info "Manual rollback may be required"
    fi
}

# Function to simulate migration in transaction
test_migration() {
    local MIGRATION_PATH="$1"
    
    print_header "🧪 Testing Migration (Dry Run)"
    
    cd "$PROJECT_DIR"
    
    # Create test script wrapped in transaction
    TEST_SCRIPT="$BACKUP_DIR/test_${TIMESTAMP}.sql"
    
    echo "BEGIN;" > "$TEST_SCRIPT"
    cat "$MIGRATION_PATH" >> "$TEST_SCRIPT"
    echo "" >> "$TEST_SCRIPT"
    echo "ROLLBACK;" >> "$TEST_SCRIPT"
    
    print_info "Running migration in test transaction..."
    
    # Try to run test
    if command -v psql &> /dev/null; then
        DB_URL=$(supabase status 2>/dev/null | grep "Database URL" | awk '{print $3}')
        
        if [ -n "$DB_URL" ]; then
            TEST_OUTPUT=$(psql "$DB_URL" -f "$TEST_SCRIPT" 2>&1)
            TEST_EXIT=$?
            
            if [ $TEST_EXIT -eq 0 ]; then
                print_status "Migration test passed - no syntax errors"
            else
                print_error "Migration test failed!"
                echo "$TEST_OUTPUT" | grep -E "(ERROR|FATAL)" | head -5 | while read -r line; do
                    print_info "  └─ $line"
                done
            fi
        fi
    else
        print_warning "psql not available - cannot test migration"
        print_info "Migration will be tested when applied"
    fi
    
    # Clean up test script
    rm -f "$TEST_SCRIPT"
}

# Function to check migration dependencies
check_dependencies() {
    print_header "🔗 Checking Dependencies"
    
    # Check if previous migrations exist
    if [ -d "$PROJECT_DIR/supabase/migrations" ]; then
        MIGRATION_COUNT=$(ls -1 "$PROJECT_DIR/supabase/migrations"/*.sql 2>/dev/null | wc -l | xargs)
        print_info "Existing migrations: $MIGRATION_COUNT"
        
        # Show last 3 migrations
        if [ $MIGRATION_COUNT -gt 0 ]; then
            print_info "Recent migrations:"
            ls -1t "$PROJECT_DIR/supabase/migrations"/*.sql 2>/dev/null | head -3 | while read -r migration; do
                print_info "  └─ $(basename "$migration")"
            done
        fi
    else
        print_warning "No existing migrations found"
    fi
    
    # Check migration naming convention
    if [ -n "$MIGRATION_FILE" ]; then
        if ! echo "$MIGRATION_FILE" | grep -qE "^[0-9]{8}[0-9]*_.*\.sql$"; then
            print_warning "Migration name doesn't follow convention: YYYYMMDD_description.sql"
        else
            print_status "Migration naming convention followed"
        fi
    fi
}

# Main execution
if [ -z "$MIGRATION_FILE" ]; then
    print_error "No migration file specified"
    print_info "Usage: $0 <migration_file.sql>"
    exit 1
fi

# Find the migration file
if [ -f "$MIGRATION_FILE" ]; then
    MIGRATION_PATH="$MIGRATION_FILE"
elif [ -f "$PROJECT_DIR/supabase/migrations/$MIGRATION_FILE" ]; then
    MIGRATION_PATH="$PROJECT_DIR/supabase/migrations/$MIGRATION_FILE"
else
    print_error "Migration file not found: $MIGRATION_FILE"
    exit 1
fi

print_info "Migration file: $(basename "$MIGRATION_PATH")"

# Run safety checks
check_supabase
if [ $? -ne 0 ]; then
    print_error "Supabase connection required for migration"
    exit 1
fi

validate_migration "$MIGRATION_PATH"
VALIDATION_RESULT=$?

backup_schema
generate_rollback "$MIGRATION_PATH"
check_dependencies
test_migration "$MIGRATION_PATH"

# Final decision
print_header "📊 Migration Safety Summary"

if [ $ERRORS -gt 0 ]; then
    print_error "Critical issues: $ERRORS"
    print_error "Migration blocked for safety"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_error "Fix the issues above before proceeding"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    print_warning "Warnings: $WARNINGS"
    print_warning "Migration has risks - proceed with caution"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Ask for confirmation
    print_info "Type 'yes' to proceed with migration despite warnings:"
    read -r CONFIRM
    
    if [ "$CONFIRM" = "yes" ]; then
        print_status "Migration approved with warnings"
        exit 0
    else
        print_error "Migration cancelled by user"
        exit 1
    fi
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_status "Migration is safe to proceed!"
    print_info "Backup created at: $BACKUP_DIR"
    exit 0
fi