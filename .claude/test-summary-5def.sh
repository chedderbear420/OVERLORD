#!/usr/bin/env bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.local/bin:$PATH"
cd ~/Projects/Overlord
rtk npm run test:strategy-dsl 2>&1 > /tmp/phase5def-tests.log || true
grep -E '^# (tests|pass|fail|skipped|duration)' /tmp/phase5def-tests.log | tail -10
grep -nE '^not ok ' /tmp/phase5def-tests.log | head -20 || true
