const correctSound = new sound('correct.mp3');
const incorrectSound = new sound('incorrect.mp3');

var showTerms = true;
var frString = '';
var lan1 = '', lan2 = '', terms = [];

document.getElementById('inputfile').addEventListener('change', function() {
	var fr = new FileReader();
	fr.onload = function() {
		if (isValidFile(fr.result)) {
			frString = fr.result;
		} else {
			frString = 'INVALID FILE';
		}
		updateShowTerms();
	}
	
	fr.readAsText(this.files[0]);
});

function isValidFile(string) {
	const a = string.split('\n');

	if (a[0].indexOf('=>') == -1) {
		lan1 = '', lan2 = '', terms = [];
		return false;
	}

	for (i = 1; i < a.length; i++) {
		if (Number.isNaN(parseFloat(a[i].split('|')[2])) || a[i].split('|').length != 3) {
			lan1 = '', lan2 = '', terms = [];
			return false;
		}
	}

	lan1 = a[0].substring(0, a[0].indexOf('=>'));
	lan2 = a[0].substring(a[0].indexOf('=>') + 2);
	
	terms = [];
	for (i = 1; i < a.length; i++) {
		terms.push([a[i].split('|')[0], a[i].split('|')[1], parseFloat(a[i].split('|')[2])]); // For old version
	}

	return true;
}

function toggleShowTerms() {
	showTerms = !showTerms;
	updateShowTerms();
}

function addTerm() {
	if (frString == 'INVALID FILE') {
		alert('Create a new set to add terms.');
	} else if (!lan1 || !lan2) {
		let a = prompt('Enter language 1.'), b = prompt('Enter language 2.');
		if (!a || !b) {
			alert('Must enter both languages.');
			return;
		}

		if (a.includes('=>') || b.includes('=>')) {
			alert('"=>" is a forbidden character.');
			return;
		}
		
		let c = prompt('Enter ' + a + ' term.'), d = prompt('Enter ' + b + ' term.');
		if (!c || !d) {
			alert('Action invalid.');
			return;
		}

		if (c.includes('|') || d.includes('|')) {
			alert('"|" is a forbidden character.');
			return;
		}

		lan1 = a, lan2 = b;
		terms.push([c, d, 0]);
		updateShowTerms();
	} else {
		let a = prompt('Enter ' + lan1 + ' term.'), b = prompt('Enter ' + lan2 + ' term.');
		if (a && b) {
			terms.push([a, b, 0]);
		} else {
			alert('Action invalid.');
		}

		updateShowTerms();
	}
}

function deleteTerm() {
	if (terms.length == 0) {
		alert('Nothing to delete.');
		return;
	}

	let p = Number.parseInt(prompt('Enter the index of the term you\'d like to delete.'), 10);

	if (!(p >= 1 && p <= terms.length)) {
		alert('Enter a valid number. (>0)');
		return;
	}

	if (confirm('Are you sure you want to delete term #' + p + ' (' + terms[p - 1][0] + ' | ' + terms[p - 1][1] + ') ?')) {
		terms.splice(p - 1, 1);
		updateShowTerms();
	}
}

function clearFile() {
	if (confirm('Do you really want to clear the file?')) {
		if (document.getElementById('inputfile').value) {
			try {
				document.getElementById('inputfile').value = '';
			} catch (err) {

			}
		}
		
		frString = '', lan1 = '', lan2 = '', terms = [];
		updateShowTerms();
	}
}

function saveFile() {
	if (lan1 == '' && lan2 == '' && terms.length == 0) {
		alert('No information to download.');
		return;
	}

	let file = new Blob([info2Txt()], {type: 'text/plain; charset=utf-8,'});
	if (window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveOrOpenBlob(file, lan1 + '_' + lan2 + '.txt');
	} else {
		let a = document.createElement('a');
		let url = URL.createObjectURL(file)
		a.href = url;
		document.body.appendChild(a);
		a.setAttribute('download', lan1 + '_' + lan2 + '.txt');
		a.click();
		setTimeout(function() {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 0);
	}
}

function updateShowTerms() {
	document.getElementById('output').textContent = showTerms ? (frString == 'INVALID FILE' ? frString : info2String()) : '';

	if (showTerms) {
		document.getElementById('outputTable').innerHTML = '';
		document.getElementById('outputTable').appendChild(createTable(terms, [3]));
	} else {
		document.getElementById('outputTable').innerHTML = '';
	}
}

function info2String() {
	if (lan1 == '' && lan2 == '' && terms.length == 0) {
		return 'No file loaded.';
	}

	return lan1 + ' => ' + lan2 + ' (' + terms.length + ' terms)' + '\n' + 'Mean score: ' + getAvgScore() + '\n';
}

function createTable(tableData, columnExcept = []) {
	let table = document.createElement('table');
	let tableBody = document.createElement('tbody');

	let i = 1;
	tableData.forEach(function(rowData) {
		let row = document.createElement('tr');
		
		let cellNum = document.createElement('td');
		cellNum.appendChild(document.createTextNode(i + '.'));
		row.appendChild(cellNum);

		let c = 0;
		rowData.forEach(function(cellData) {
			if (!columnExcept.includes(c)) {
				let cell = document.createElement('td');
				cell.appendChild(document.createTextNode(cellData));
				row.appendChild(cell);
			}
			c++;
		});

		tableBody.appendChild(row);
		i++;
	});

	table.appendChild(tableBody);

	return table;
}


function info2Txt() {
	if (lan1 == '' && lan2 == '' && terms.length == 0) {
		return '';
	}

	let s = lan1 + '=>' + lan2;
	
	for (let i = 0; i < terms.length; i++) {
		s += '\n' + terms[i][0] + '|' + terms[i][1] + '|' + terms[i][2];
	}
	return s;
}

let quizIndex = 0, quizTotal = 0;
let wantsAll = [];

function mcqQuiz() {
	if (terms.length < 4) {
		alert('Not enough terms to quiz. (min 4)');
		return;
	}

	let dupes = checkLang1Duplicates();
	if (dupes) {
		if (!confirm('WARNING: There are duplicate entries for ' + lan1 + ' (#' + (dupes[0] + 1) + ', #' + (dupes[1] + 1) + '). Continue?')) {
			return;
		}
	}

	dupes = countUniqueElements(generateLan2List()) < 4;
	if (dupes) {
		if (!confirm('WARNING: There are <4 unique entries for ' + lan2 + '. Continue?')) {
			return;
		}
	}

	let p = prompt('Enter the number of questions for this session.');

	if (p.toLowerCase() == 'all') {
		wantsAll = shuffleArray(range(0, terms.length, 1));
		p = terms.length;
		// console.log(wantsAll);
	} else {
		p = Number.parseInt(p, 10);
		if (!(p > 0)) {
			alert('Enter a valid number. (> 0)');
			return;
		}
	}

	document.getElementById('big-1').style.display = 'none';
	document.getElementById('big-2').style.display = 'block';
	quizTotal = p;
	quizIndex = 0;
	mcq(quizIndex, quizTotal);
}

let correctIndex;
let answers;

let hasClickedMcqAns = false;

function mcq(num, total) {
	let allAns = document.getElementsByClassName('answer-box');
	for (let i = 0; i < allAns.length; i++) {
		allAns[i].style.backgroundColor = null;
	}

	document.getElementById('checkOrX1').innerHTML = '';

	let q = document.getElementById('question1'),
		qNum = document.getElementById('questionNum1');
	let a = document.getElementById('answerA'),
		b = document.getElementById('answerB'),
		c = document.getElementById('answerC'),
		d = document.getElementById('answerD');
	
	if (num == total) {
		q.textContent = '', qNum.textContent = '', a.textContent = '', b.textContent = '', c.textContent = '', d.textContent = '';
		quizIndex = 0, quizTotal = 0, wantsAll = [];
		document.getElementById('big-1').style.display = 'block';
		document.getElementById('big-2').style.display = 'none';
		return;
	}

	correctIndex = wantsAll.length ? wantsAll[num] : getLowestConfidenceIndex();
	// console.log(terms[correctIndex]);
	q.textContent = terms[correctIndex][0];
	qNum.textContent = '(' + (num + 1) + '/' + total + ')';

	answers = generateAnswers(correctIndex);
	a.textContent = terms[answers[0]][1];
	b.textContent = terms[answers[1]][1];
	c.textContent = terms[answers[2]][1];
	d.textContent = terms[answers[3]][1];

	hasClickedMcqAns = false;

	// console.log(answers);
	MathJax.typeset();
}

async function mcqAnswer(index) {
	if (!hasClickedMcqAns) {
		hasClickedMcqAns = true;

		if ((correctIndex + 1) && answers) {

			let letters = ['answerA', 'answerB', 'answerC', 'answerD'];
			if (terms[answers[index]][1] == terms[correctIndex][1]) {
				terms[correctIndex][2] = Math.log(Math.exp(terms[correctIndex][2]) + 1);

				document.getElementById('checkOrX1').innerHTML = '<span style="color: rgb(0, 255, 0);">✓</span>';
				document.getElementById(letters[index]).style.backgroundColor = 'rgb(0, 127, 0)';
				correctSound.play();
				updateShowTerms();

				await sleep(1000);

				correctIndex = null;
				answers = null;

				mcq(++quizIndex, quizTotal);
			} else {
				terms[answers[index]][2] = (terms[answers[index]][2] - 0.1 <= 0) ? 0 : (terms[answers[index]][2] - 0.1);
				terms[correctIndex][2] = (terms[correctIndex][2] - 0.1 <= 0) ? 0 : (terms[correctIndex][2] - 0.1);

				document.getElementById('checkOrX1').innerHTML = '<span style="color: rgb(255, 0, 0);">✗</span>';
				document.getElementById(letters[answers.indexOf(correctIndex)]).style.backgroundColor = 'rgb(0, 127, 0)';
				incorrectSound.play();
				updateShowTerms();

				checkTypingAfterWrong(5, 'mcq');
			}
		}
	}
}

function checkTypingAfterWrong(numLeft, type) {
	if (numLeft != 0) {
		document.getElementById('review').style.display = 'block';
		document.getElementById('reviewCount').textContent = numLeft;

		let box = document.getElementById('reviewBox');
		box.style.backgroundColor = 'rgb(255, 128, 128)';
		box.placeholder = terms[correctIndex][1];
		box.value = '';
		box.addEventListener('input', function() {
			updateBox(numLeft, type);
		});
	} else {
		document.getElementById('review').style.display = 'none';
		correctIndex = null;
		answers = null;

		if (type == 'mcq') {
			mcq(++quizIndex, quizTotal);
		} else if (type == 'frq') {
			frq(++quizIndex, quizTotal);
		}
	}
}

async function updateBox(numLeft, type) {
	let box = document.getElementById('reviewBox');
	// console.log(terms[correctIndex][1]);
	if (box.value == terms[correctIndex][1]) {
		box.style.backgroundColor = 'rgb(128, 255, 128)';
		let newBox = box.cloneNode(true);
		box.parentNode.replaceChild(newBox, box);
		newBox.focus();
		await sleep(500);
		checkTypingAfterWrong(--numLeft, type);
	} else {
		box.style.backgroundColor = 'rgb(255, 128, 128)';
	}
	
}

function frqQuiz() {
	if (terms.length < 4) {
		alert('Not enough terms to quiz. (min 4)');
		return;
	}

	let dupes = checkLang1Duplicates();
	if (dupes) {
		if (!confirm('WARNING: There are duplicate entries for ' + lan1 + ' (#' + (dupes[0] + 1) + ', #' + (dupes[1] + 1) + '). Continue?')) {
			return;
		}
	}

	let p = prompt('Enter the number of questions for this session.');

	if (p.toLowerCase() == 'all') {
		wantsAll = shuffleArray(range(0, terms.length, 1));
		p = terms.length;
		// console.log(wantsAll);
	} else {
		p = Number.parseInt(p, 10);
		if (!(p > 0)) {
			alert('Enter a valid number. (> 0)');
			return;
		}
	}

	document.getElementById('big-1').style.display = 'none';
	document.getElementById('big-3').style.display = 'block';
	quizTotal = p;
	quizIndex = 0;
	frq(quizIndex, quizTotal);
}

function frq(num, total) {
	document.getElementById('checkOrX2').innerHTML = '';
	document.getElementById('frqConfirm').style.display = 'none';
	document.getElementById('submitFrq').style.display = 'flex';

	let q = document.getElementById('question2'),
		qNum = document.getElementById('questionNum2'),
		frqLang = document.getElementById('frqLang');
	let a = document.getElementById('frq-box');
	
	if (num == total) {
		q.textContent = '', qNum.textContent = '';
		quizIndex = 0, quizTotal = 0, wantsAll = [];
		document.getElementById('big-1').style.display = 'block';
		document.getElementById('big-3').style.display = 'none';
		return;
	}

	correctIndex = wantsAll.length ? wantsAll[num] : getLowestConfidenceIndex();
	// console.log(terms[correctIndex]);
	q.textContent = terms[correctIndex][0];
	qNum.textContent = '(' + (num + 1) + '/' + total + ')';
	frqLang.textContent = lan2;
	a.value = '';

	MathJax.typeset();
}

async function frqAnswer() {
	document.getElementById('submitFrq').style.display = 'none';
	let a = document.getElementById('frq-box');
	if (a.value == terms[correctIndex][1]) {
		terms[correctIndex][2] = Math.log(Math.exp(terms[correctIndex][2]) + 1);

		document.getElementById('checkOrX2').innerHTML = '<span style="color: rgb(0, 255, 0);">✓</span>';
		correctSound.play();
		updateShowTerms();

		await sleep(1000);

		correctIndex = null;
		answers = null;

		frq(++quizIndex, quizTotal);
	} else {
		document.getElementById('frqConfirm').style.display = 'block';
		document.getElementById('frqConfirmToggleDiv').style.display = 'block';
		document.getElementById('frqCorrect').textContent = terms[correctIndex][1];
	}
}

async function frqConfirm(isCorrect) {
	document.getElementById('frqConfirmToggleDiv').style.display = 'none';
	if (isCorrect) {
		terms[correctIndex][2] = Math.log(Math.exp(terms[correctIndex][2]) + 1);

		document.getElementById('checkOrX2').innerHTML = '<span style="color: rgb(0, 255, 0);">✓</span>';
		correctSound.play();
		updateShowTerms();

		await sleep(1000);

		correctIndex = null;
		answers = null;

		frq(++quizIndex, quizTotal);
	} else {
		terms[correctIndex][2] = (terms[correctIndex][2] - 0.1 <= 0) ? 0 : (terms[correctIndex][2] - 0.1);
		document.getElementById('checkOrX2').innerHTML = '<span style="color: rgb(255, 0, 0);">✗</span>';
		incorrectSound.play();
		updateShowTerms();

		checkTypingAfterWrong(5, 'frq');
	}
}

function flashcards() {
	document.getElementById('big-1').style.display = 'none';
	document.getElementById('big-4').style.display = 'block';
}

function endFlashcards() {
	document.getElementById('big-4').style.display = 'none';
	document.getElementById('big-1').style.display = 'block';
}

function swapLan() {
	[lan1, lan2] = [lan2, lan1];
	terms.forEach(e => {
		[e[0], e[1]] = [e[1], e[0]];
	});

	updateShowTerms();
}

function sortTerms() {
	let termsCopy = deepCopy(terms);
	termsCopy.forEach((e, i) => {
		e.push(i);
	});

	let temp = [];
	// console.log(terms);

	while (termsCopy.length != 0) {
		let minIndex = [0];
		for (let i = 1; i < termsCopy.length; i++) {
			if (termsCopy[i][2] == termsCopy[minIndex[0]][2]) {
				minIndex.push(i);
			} else if (termsCopy[i][2] < termsCopy[minIndex[0]][2]) {
				minIndex = [i];
			}
		}

		shuffleArray(minIndex).forEach(e => {
			temp.push(termsCopy[e]);
		});

		minIndex.sort(function(a, b) {return a - b;});
		minIndex.reverse();

		for (let i = 0; i < minIndex.length; i++) {
			termsCopy.splice(minIndex[i], 1);
		}
	}
	
	return temp;
}

function getAvgScore() {
	let m = 0;

	for (let i = 0; i < terms.length; i++) {
		m += terms[i][2];
	}

	return terms.length ? m / terms.length : 0;
}

function generateLan2List() {
	let temp = [];

	for (let i = 0; i < terms.length; i++) {
		temp.push(terms[i][1]);
	}

	return temp;
}

function getLowestConfidenceIndex() {
	if (terms.length == 0) {
		return null;
	}

	let tempTerms = sortTerms();
	let minVal = tempTerms[0][2];
	let minIndex = [];
	// console.log(tempTerms);
	for (let i = 0; i < tempTerms.length; i++) {
		if (tempTerms[i][2] < minVal + 2) {
			minIndex.push(tempTerms[i][tempTerms[0].length - 1]);
		}
	}
	// console.log(minIndex);

	return minIndex[Math.floor(Math.random() * minIndex.length)];
}

function generateAnswers(correctIndex) {
	if (terms.length < 4) {
		return null;
	}

	let hasDuplicates = countUniqueElements(generateLan2List()) < 4;

	let a = [correctIndex];
	let b = [terms[correctIndex][1]];

	for (let i = 0; i < 3; i++) {
		let foundValid = false;
		while (!foundValid) {
			let j = Math.floor(Math.random() * terms.length);
			if (!a.includes(j) && (hasDuplicates || !b.includes(terms[j][1]) )) {
				foundValid = true;
				a.push(j);
				b.push(terms[j][1]);
			}
		}
	}

	return shuffleArray(a);
}

function checkLang1Duplicates() {
	for (let i = 0; i < terms.length - 1; i++) {
		for (let j = i + 1; j < terms.length; j++) {
			if (terms[i][0] == terms[j][0]) {
				return [i, j];
			}
		}
	}
	return false;
}
