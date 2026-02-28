DELETE FROM cleaning_chemicals
WHERE id = $1
RETURNING id;
