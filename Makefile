.PHONY: up down test logs seed

up:
	docker-compose up -d

down:
	docker-compose down

test:
	cd backend && source .venv/bin/activate && python -m pytest tests/ -v

logs:
	docker-compose logs -f

seed:
	curl -X POST http://localhost:8000/api/admin/seed
