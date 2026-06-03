/**
 * js/lib.js — Zentrale externe Bibliotheken
 *
 * EINE React-Instanz für die gesamte App.
 * Alle anderen Dateien importieren React, htm, idb von hier.
 *
 * Verwendung:
 *   import { React, html, useState, useEffect, openDB } from '../lib.js';
 *   import { React, html, useState } from '../../lib.js';
 */

import React, { createRoot } from '../assets/vendor/react.js';
import htm from '../assets/vendor/htm.js';
import { openDB as _openDB } from '../assets/vendor/idb.js';

// htm an UNSERE React-Instanz binden — verhindert Mehrfach-Instanz-Fehler
const html = htm.bind(React.createElement);

// React Hooks als benannte Exporte
const {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
  createContext,
  Fragment,
} = React;

export {
  React,
  html,
  createRoot,
  // Hooks
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
  createContext,
  Fragment,
  // idb (als openDB re-exportiert)
};
export { _openDB as openDB };
