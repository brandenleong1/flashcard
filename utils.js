function countUniqueElements(array) {
	let c = 0;
	for (let i = 0; i < array.length; i++) {
		if (countInstancesOf(array[i], array) == 1) {
			c++;
		}
	}
	return c;
}

function countInstancesOf(element, array) {
	let c = 0;
	for (let i = 0; i < array.length; i++) {
		if (array[i] == element) {
			c++;
		}
	}
	return c;
}

function range(start, stop, interval) {
	let a = [];
	for (let i = start; i < stop; i += interval) {
		a.push(i);
	}
	return a;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
	return array;
}

function deepCopy(array) {
	let temp = [];
	for (let i = 0; i < array.length; i++) {
		temp.push(Array.isArray(array[i]) ? deepCopy(array[i]) : array[i]);
	}
	return temp;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function sound(src) {
	this.sound = document.createElement("audio");
	this.sound.src = src;
	this.sound.setAttribute("preload", "auto");
	this.sound.setAttribute("controls", "none");
	this.sound.style.display = "none";
	document.body.appendChild(this.sound);

	this.play = function() {
		this.sound.play();
	}

	this.stop = function() {
		this.sound.pause();
	}

	this.remove = function() {
		this.sound.remove();
	}
}
