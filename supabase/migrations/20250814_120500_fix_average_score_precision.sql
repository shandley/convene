-- Fix average_score column precision to handle larger values
-- The current numeric(3,2) only allows -9.99 to 9.99
-- Change to numeric(5,2) to allow -999.99 to 999.99

ALTER TABLE applications 
ALTER COLUMN average_score TYPE numeric(5,2);