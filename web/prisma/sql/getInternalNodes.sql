-- @param {Int} $1:worldId
SELECT 
  n.id, 
  n.name
FROM "Node" n
LEFT JOIN "Edge" e 
  ON e."node1Id" = n.id OR e."node2Id" = n.id
WHERE n."worldId" = ?1
GROUP BY n.id
HAVING COUNT(e.id) > 1