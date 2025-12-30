// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock localStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();

// Make localStorage methods spyable
global.localStorage.getItem = jest.fn(global.localStorage.getItem.bind(global.localStorage));
global.localStorage.setItem = jest.fn(global.localStorage.setItem.bind(global.localStorage));
global.localStorage.removeItem = jest.fn(global.localStorage.removeItem.bind(global.localStorage));
global.localStorage.clear = jest.fn(global.localStorage.clear.bind(global.localStorage));
