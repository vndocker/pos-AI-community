# General Development Rules

You should do task-based development. For every task, you should write the tests, implement the code, and run the tests to make sure everything works. Use `npm run test run -t "should correctly add numbers" tests/example.test.js` to run a specific test.

When the tests pass:
* Update the todo list to reflect the task being completed
* Update the memory file to reflect the current state of the project
* Fix any warnings or errors in the code
* Commit the changes to the repository with a descriptive commit message
* Update the development guidelines to reflect anything that you've learned while working on the project
* Stop and we will open a new chat for the next task

## Retain Memory

There will be a memory file for every project.

The memory file will contain the state of the project, and any notes or relevant details you'd need to remember between chats.

Keep it up to date based on the project's current state. 

Do not annotate task completion in the memory file. It will be tracked in the to-do list.

## Update development guidelines

If necessary, update the development guidelines to reflect anything you've learned while working on the project.

## Mobile-First Development

When implementing responsive designs, follow these guidelines:

1. **Start with Mobile Design First**
   - Design and implement for mobile screens first
   - Progressively enhance for larger screens
   - Use Material UI's useMediaQuery hook for responsive breakpoints

2. **Responsive Layout Patterns**
   - Stack elements vertically on mobile
   - Use collapsible/expandable sections for mobile
   - Implement toggle buttons for showing/hiding sections on small screens
   - Optimize touch targets (minimum 44x44px) for mobile

3. **Testing Responsive Designs**
   - Create specific tests for different viewport sizes
   - Use the createMatchMedia utility for mocking different screen sizes
   - Test touch interactions and mobile-specific features

## Offline-First Development

When implementing offline capabilities, follow these guidelines:

1. **Service Worker Implementation**
   - Use cache-first strategy for static assets
   - Use network-first with cache fallback for API requests
   - Implement background sync for offline operations

2. **Local Storage Strategy**
   - Use IndexedDB for structured data storage
   - Implement clear error handling and fallbacks
   - Design sync mechanisms for offline data
   - Consider storage limits and data expiration

3. **User Experience**
   - Provide clear indicators for offline status
   - Implement feedback for offline operations
   - Design graceful degradation of features when offline
   - Ensure critical functionality works without network
