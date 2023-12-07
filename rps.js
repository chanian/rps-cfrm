// 🐐 https://poker.cs.ualberta.ca/publications/NIPS07-cfr.pdf
const ROCK = 0;
const PAPER = 1;
const SCISSORS = 2;
const MOVES = [ROCK, PAPER, SCISSORS];

// Given two actions return a regret vector
function getRegretVector(p1Action, p2Action) {
	var regret = {};
	var actualPayout = getUtility(p1Action, p2Action);
	var regretRock = getUtility(ROCK, p2Action);
	var regretPaper = getUtility(PAPER, p2Action);
	var regretScissors = getUtility(SCISSORS, p2Action);

	// Calculate Counterfactual regrets
	regret[ROCK] = regretRock - actualPayout;
	regret[PAPER] = regretPaper - actualPayout;
	regret[SCISSORS] = regretScissors - actualPayout;

	return regret;
}
// Take a regret vector, calculate an updated strategy
function getStrategyFromRegrets(regrets) {
	var totalRegret = 0;
	var weights = [0,0,0];

	// Equation (6), only look at the positive regrets
	regrets.forEach((r) => {
		totalRegret += Math.max(0, r);	
	});
	// We lack data, or there are no regrets
	// Equation (8)
	if(totalRegret <= 0) {
		// "If no actions have any positive counterfactual regret, then the action is selected randomly"
		// A random or equal base strategy should/would yield same results over time
		return uniformStrategy();
	}
	// Normalize as proportion of total regret
	regrets.forEach((r,i) => {
		// Equation (6)
		// "... be the positive portion of immediate counterfactual regret"
		if(r >= 0) {
			// Equation (8), Minimize regrets
			// "... proportion to the amount of positive counterfactual regret"
			weights[i] = r / totalRegret;
		}
	});
	return weights;
}

// Used as the placeholder / default (coincidentally, just happens to be Nash)
function uniformStrategy() {
	return [1/3, 1/3, 1/3];
}
// Given a strategy vector, return a new random move accordingly
function getMove(strategy) {
	var c = 0;
	var roll = Math.random();
	for(let i = 0 ; i < MOVES.length ; i++) {
		c += strategy[i];
		if(roll <= c) {
			return MOVES[i];
		}
	}
}

// Game rules, evaluate the utility score of game result aka: winner
function getUtility(h1, h2) {
	if(h1 == h2) { return 0; }
	if(h1 == ROCK && h2 == SCISSORS) { return 1; }
	if(h1 == ROCK && h2 == PAPER) { return -1; }
	if(h1 == SCISSORS && h2 == PAPER) { return 1; }
	if(h1 == SCISSORS && h2 == ROCK) { return -1; }
	if(h1 == PAPER && h2 == ROCK) { return 1; }
	if(h1 == PAPER && h2 == SCISSORS) { return -1; }
}

// The NashStrategy is the average (not the final iteration)
// Curious if a different average (decayed, trailing, harmonic mean etc) would make any difference here?
// over infinite trials, probably not
function getStrategyAverage(strategy) {
	let sum = [0,0,0];
	let total = strategy.length;
	strategy.forEach((s,i) => {
		MOVES.forEach((action) => { sum[action] += s[action] });
	});
	// (4) Final strategy is the average of all strategies
	// https://aipokertutorial.com/the-cfr-algorithm/#why-average-strategy
	sum.forEach((s,i) => sum[i] /= total);
	return sum;
}


// Run T sims of two strategies and print the normalized EV
function sim(T, p1Vector, p2Vector) {
	var p1Wins = 0;
	var p2Wins = 0;
	for(let i = 0; i < T; i++) {
		let p1 = getMove(p1Vector);
		let p2 = getMove(p2Vector);
		let winner = getUtility(p1, p2);
		if(winner == 1) {
			p1Wins++;
		} else if(winner == -1) {
			p2Wins++;
		}
	}
	console.log("EV per hand:");
	console.log("P1: ", (p1Wins - p2Wins)/T);
	console.log("P2: ", (p2Wins - p1Wins)/T);
}

// Counterfactual Regret Minimization training over T iterations
function train(T) {
	var p1CumulativeRegret = [0,0,0];
	var p2CumulativeRegret = [0,0,0];
	let p1StrategyHistory = [];
	let p2StrategyHistory = [];
	for(let i = 0; i < T; i++) {
		let s1 = getStrategyFromRegrets(p1CumulativeRegret);
		let s2 = getStrategyFromRegrets(p2CumulativeRegret)
		let p1 = getMove(s1);
		let p2 = getMove(s2);
		let regret1 = getRegretVector(p1, p2);
		let regret2 = getRegretVector(p2, p1);
		MOVES.forEach((action) => {
			p1CumulativeRegret[action] += regret1[action];
			p2CumulativeRegret[action] += regret2[action];
		});
		p1StrategyHistory.push(s1);
		p2StrategyHistory.push(s2);
	}
	console.log(getStrategyAverage(p1StrategyHistory));
}

train(10000);
// sim(100000, [0.1,0.1,0.8], [.8,.2,0]);