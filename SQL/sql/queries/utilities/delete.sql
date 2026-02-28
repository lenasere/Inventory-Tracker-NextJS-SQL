DELETE FROM utilities
WHERE id = $1
RETURNING id;
