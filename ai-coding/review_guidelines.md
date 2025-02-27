# Review guidelines

When you have finished a project:
## Backend (FastAPI)
* Run formatters: black . & isort .
* Validate code quality: flake8 & mypy .
* Test thoroughly: pytest --cov=app tests/
* Fix all failing tests
* Fix all warnings

## Frontend (React Vite)
* Format and lint: npm run lint & npm run format
* Run all tests: npm run test
* Verify build: npm run build & npm run preview
* Fix all failing tests
* Fix all warnings

## Integration
*  Confirm API contracts match between frontend/backend
* Test complete user flows end-to-end
* Review changed files: git diff --name-only main
* Review each of them according to the guidelines in the project memory
* Review the todo list and verify all the tasks are completed
* Review the project memory, and evaluate what should be added to the application memory
* Review the development guidelines, and evaluate what should be added to the development guidelines

## Remember: Quality verification before delivery prevents technical debt accumulation.
