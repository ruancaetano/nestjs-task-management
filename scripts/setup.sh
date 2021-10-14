# TODO refact to insert envs from a secret like github secret during deploy action

echo "NODE_ENV=production" > .env
echo "PORT=3000" >> .env
echo "DB_HOST=database" >> .env
echo "DB_PORT=5432" >> .env
echo "DB_NAME=task_management" >> .env
echo "DB_USER=root" >> .env
echo "DB_PASS=development" >> .env
echo "JWT_SECRET=topsecret51" >> .env