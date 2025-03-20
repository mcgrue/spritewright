# get the first argument and save it as TEST_FILE
TEST_FILE=$1

echo ""

# make a test function that emits red text to stderr
function err() {
	echo -e "❌ \e[97;41m$1\e[0m" >&2
}

# wrap everying in a function that returns the first non-zero exit code if any are caught within, and returns 0 if everything succeeds
function run_test() {

	# if TEST_FILE is empty, return 1
	if [ -z "$TEST_FILE" ]; then
		err "No test file provided"
		return 1
	fi

	# if TEST_FILE does not end in .ts, return 2
	if [[ ! "${TEST_FILE}" =~ \.ts$ ]]; then
		err "Test files must be .ts files"
		return 2
	fi

	# if TEST_FILE ends with .ts but not .test.ts, replace .ts with .test.ts
	if [[ "${TEST_FILE}" =~ \.ts$ && ! "${TEST_FILE}" =~ \.test\.ts$ ]]; then
		TEST_FILE="${TEST_FILE%.ts}.test.ts"
	fi

	# echo the TEST_FILE literal
	echo "Running test file: '$TEST_FILE'"

  yarn test:debug "${TEST_FILE}"
}

# call run_tests and if it returns 0, run grue:success, otherwise run grue:fail
run_test && yarn grue:success > /dev/null 2>&1 || yarn grue:fail > /dev/null 2>&1

echo ""
