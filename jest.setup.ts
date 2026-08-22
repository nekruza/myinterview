// Runs before every test file, in both the `node` and `jsdom` environments.

// jest-dom's DOM matchers are only meaningful under jsdom. Registering them in
// the node environment would throw, so load them conditionally.
if (typeof document !== 'undefined') {
  // Must be a conditional runtime load, not a static import: the matchers are
  // only valid under jsdom.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@testing-library/jest-dom')
}

// Keep test output readable: route handlers log expected errors via
// console.error on their failure paths. Silence those, but surface anything
// unexpected by restoring the spies after each file.
const noop = () => {}
let errorSpy: jest.SpyInstance
let warnSpy: jest.SpyInstance

beforeAll(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(noop)
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(noop)
})

afterAll(() => {
  errorSpy?.mockRestore()
  warnSpy?.mockRestore()
})
