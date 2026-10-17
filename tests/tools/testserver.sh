#!/bin/bash
# Build a frozen copy for regression tests (immune to HMR reloads while editing) and serve it on :4173.
cd /workspace/emberfall && npx vite build --outDir /tmp/ember-test --emptyOutDir --logLevel error && (pkill -f "vite preview.*4173" ; nohup npx vite preview --outDir /tmp/ember-test --port 4173 --strictPort > /tmp/ember-test.log 2>&1 &) && sleep 2 && curl -s -o /dev/null -w "test server %{http_code}\n" localhost:4173
