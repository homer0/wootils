@echo off
yarn --version >NUL 2>&1 && (
  yarn run lint:full
) || (
  echo "ERROR: You need either Yarn or WSL to work on windows"
  exit 1
)
