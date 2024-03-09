let speech = new SpeechSynthesisUtterance();
let voices = window.speechSynthesis.getVoices();
speech.lang = "en";
speech.volume = 1;
speech.rate = 1;
speech.pitch = 1;
speech.voice = voices[0];

function startSpeech(text) {
	speech.text = text;
	window.speechSynthesis.speak(speech);
}

function cancelSpeech() {
	window.speechSynthesis.cancel();
}