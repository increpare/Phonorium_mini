const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let canvas = document.getElementById('game');
// get canvas context
let ctx = canvas.getContext('2d');
// load image

let stumm = false;

const LEVEL_ZAHL = 10;
const PATTERN_LAENGE = 5;

let winstate = false;

let poweroff = true;
let level = 0;
let runde_phase = 0;
//phase 0, kein besonderer zusatz-zustand

//phase 1, replay position
let phase_1_abspiel_position = -1;

//phase 2: input position
let phase2_flash = true;
let phase2_wait = false;
let sound_pattern = [];
let input_pattern = [];

let sprache = 0;

let cw = canvas.width;
let ch = canvas.height;

let music = null;

let first_pattern_playthrough = false;

let sequenz_spielend = false;
let time = 0;

function reOffset() {
	let BB = canvas.getBoundingClientRect();
	offsetX = BB.left;
	offsetY = BB.top;

	cw = canvas.width;
	ch = canvas.height;
}

let pressed = [false, false, false, false, false, false];

let offsetX, offsetY;
reOffset();
window["onscroll"] = function (e) { reOffset(); }
window["onresize"] = function (e) { reOffset(); }


let score = 0;
let linecount = [0, 0, 0, 0];

let highscore = 0;

let images = [];

let gw = 4;
let gh = 4;



let verloren = false;

let last = 1;
let laster = -1;


let raster_b = 10;
let raster_h = 14;
let verborgene_zeilen = 4;

let zustand = [];
let anims = [];


let alle_zustände = [];
let alle_anims = [];

function holZufälligeIntInklusi(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}


function playAudio(a) {
	a.pause();
	a.currentTime = 0;
	a.load();
	a.play();
}

function leftmost(stück) {
	let stück_h = stück.length;
	let stück_b = stück[0].length;

	for (let i = 0; i < stück_b; i++) {
		for (let j = 0; j < stück_h; j++) {
			if (stück[j][i] > 0) {
				return i;
			}
		}
	}

	console.log("Soll nich hier ankommen! Muss 'nen Fehler geben.")
	return -1;
}


let soff = 0;
function generatePattern() {
	first_pattern_playthrough = true;
	sound_pattern = [];
	for (let i = 0; i < PATTERN_LAENGE; i++) {
		//pick a random integer 0-3
		let r = Math.floor(Math.random() * 4);
		sound_pattern.push(r);
	}

	//make sure the pattern contains every number (0-3) once
	for (let i = 0; i < 4; i++) {
		let found = false;
		for (let j = 0; j < PATTERN_LAENGE; j++) {
			if (sound_pattern[j] == i) {
				found = true;
				break;
			}
		}
		if (!found) {
			//remove a repeated element from sound_pattern
			for (let j = 0; j < PATTERN_LAENGE; j++) {
				let element = sound_pattern[j];
				if (sound_pattern.indexOf(element) < j) {
					sound_pattern.splice(j, 1, i);
					break;
				}
			}
		}
	}

	//if you find three of the same element in a row, change one
	for (let i = 2; i < PATTERN_LAENGE; i++) {
		if (sound_pattern[i] === sound_pattern[i - 1] && sound_pattern[i] === sound_pattern[i - 2]) {
			sound_pattern[i] = (sound_pattern[i] + Math.floor(Math.random() * 3)) % 4;
		}
	}

}

function redraw() {

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage(images["device"], 0, 0);

	if (poweroff === false) {
		ctx.drawImage(images["power_light_green"], 10, 12);
	}


	if (poweroff === false) {

		if (winstate) {
			for (let i = 0; i < 3; i++) {
				ctx.drawImage(images["phase_light_green"], 17 + 20 * i, 55);
			}

			for (let i = 0; i < LEVEL_ZAHL; i++) {
				ctx.drawImage(images["progress_light_orange"], 11 + 6 * i, 28);
			}

			for (let i = 0; i < PATTERN_LAENGE; i++) {
				ctx.drawImage(images["pattern_light_green"], 37 + 7 * i, 39);
			}

		} else {
			//fortschrittleiste
			for (let i = 0; i < level; i++) {
				ctx.drawImage(images["progress_light_purple"], 11 + 6 * i, 28);
			}
			ctx.drawImage(images["progress_light_orange"], 11 + 6 * level, 28);

			if (runde_phase === 0) {
				//no special treatment needed
			} else if (runde_phase === 1) {
				//replay happening - draw position
				if (phase_1_abspiel_position >= 0) {
					ctx.drawImage(images["pattern_light_orange"], 37 + 7 * phase_1_abspiel_position, 39);
				}
			} else if (runde_phase === 2) {
				//input happening, draw lights up to phase_2_abspiel_position
				if (input_pattern.length === PATTERN_LAENGE && !phase2_wait) {
					if (phase2_flash === true) {
						for (let i = 0; i < input_pattern.length; i++) {
							if (input_pattern[i] === sound_pattern[i]) {
								ctx.drawImage(images["pattern_light_green"], 37 + 7 * i, 39);
							} else {
								ctx.drawImage(images["pattern_light_red"], 37 + 7 * i, 39);
							}
						}
					}
				} else {
					for (let i = 0; i < input_pattern.length; i++) {
						ctx.drawImage(images["pattern_light_purple"], 37 + 7 * i, 39);
					}
					if (input_pattern.length < PATTERN_LAENGE) {
						ctx.drawImage(images["pattern_light_orange"], 37 + 7 * input_pattern.length, 39);
					}
				}
			}

			ctx.drawImage(images["phase_light_green"], 17 + 20 * runde_phase, 55);
		}
	}

	for (i = 0; i < pressed.length; i++) {
		let dat = image_x_y[i];

		if (pressed[i]) {
			ctx.drawImage(images[dat[0]], dat[1], dat[2]);
		}
	}

}

let image_names = [
	"device",

	"button_play_pressed",

	"button1_disabled_pressed",

	"button2_disabled_pressed",

	"button3_disabled_pressed",

	"button4_disabled_pressed",


	"pattern_light_orange",
	"pattern_light_purple",
	"pattern_light_red",
	"pattern_light_green",

	"phase_light_green",
	"phase_light_pink",

	"power_light_green",

	"progress_light_orange",
	"progress_light_purple"

];


let image_x_y = [

	["button1_disabled_pressed", 10, 99, 28, 28],
	["button2_disabled_pressed", 43, 99, 28, 28],
	["button3_disabled_pressed", 10, 132, 28, 28],
	["button4_disabled_pressed", 43, 132, 28, 28],

	// ["button1_enabled_pressed","button1_enabled_unpressed",10,103,23,23],
	// ["button2_enabled_pressed","button2_enabled_unpressed",48,103,23,23],
	// ["button3_enabled_pressed","button3_enabled_unpressed",29,121,23,23],
	// ["button4_enabled_pressed","button4_enabled_unpressed",10,139,23,23],
	// ["button5_enabled_pressed","button5_enabled_unpressed",48,139,23,23],

	["button_play_pressed", 31, 85, 19, 9],

];

for (let i = 0; i < image_names.length; i++) {
	let image = new Image();
	image.onload = function () {
		// draw the image into the canvas
		redraw();
	}
	image.src = "gfx/" + image_names[i] + ".png";
	images[image_names[i]] = image;
}

let sfx_paths = [
	"error.mp3",
	"fail.mp3",
	"power_off.mp3",
	"power_on.mp3",
	"solve.mp3",
	"win.mp3",
];

let sfx = [];

for (let i = 0; i < sfx_paths.length; i++) {
	let path = sfx_paths[i];
	//remove file extension from path
	let name = path.substring(0, path.lastIndexOf('.'));
	sfx[name] = new Audio("sfx/" + path);
}


//sounds
let sound_paths_flat = [
	"_alv_obstr/Alveolar_ejective_fricative.mp3",
	"_alv_obstr/Voiced_alveolar_affricate.mp3",
	"_alv_obstr/Voiced_alveolar_fricative.mp3",
	"_alv_obstr/Voiceless_alveolar_fricative.mp3",
	"_alv_v_ret/Voiced_alveolar_plosive.mp3",
	"_alv_v_ret/Voiced_retroflex_plosive.mp3",
	"_alv_v_ret/Voiceless_alveolar_plosive.mp3",
	"_alv_v_ret/Voiceless_retroflex_plosive.mp3",
	"_ant_fric/Voiced_dental_fricative.mp3",
	"_ant_fric/Voiceless_bilabial_fricative.mp3",
	"_ant_fric/Voiceless_dental_fricative.mp3",
	"_ant_fric/Voiceless_labiodental_fricative.mp3",
	"_ant_lab_vel_1/ant_lab_vel_1.mp3",
	"_ant_lab_vel_1/ant_lab_vel_2.mp3",
	"_ant_lab_vel_1/ant_lab_vel_4.mp3",
	"_ant_lab_vel_1/ant_lab_vel_5.mp3",
	"_ant_lab_vel_2/ant_lab_vel_10.mp3",
	"_ant_lab_vel_2/ant_lab_vel_11.mp3",
	"_ant_lab_vel_2/ant_lab_vel_7.mp3",
	"_ant_lab_vel_2/ant_lab_vel_8.mp3",
	"_cor_affr/Voiced_alveolo-palatal_affricate.mp3",
	"_cor_affr/Voiced_palato-alveolar_affricate.mp3",
	"_cor_affr/Voiceless_alveolo-palatal_affricate.mp3",
	"_cor_affr/Voiceless_palato-alveolar_affricate.mp3",
	"_cor_fric_1/Voiced_postalveolar_fricative.mp3",
	"_cor_fric_1/Voiced_retroflex_fricative.mp3",
	"_cor_fric_1/Voiceless_postalveolar_fricative.mp3",
	"_cor_fric_1/Voiceless_retroflex_fricative.mp3",
	"_cor_fric_2/Voiced_alveolo-palatal_fricative.mp3",
	"_cor_fric_2/Voiced_palatal_fricative.mp3",
	"_cor_fric_2/Voiceless_alveolo-palatal_fricative.mp3",
	"_cor_fric_2/Voiceless_palatal_fricative.mp3",
	"_dors/Voiced_uvular_fricative.mp3",
	"_dors/Voiced_uvular_implosive.mp3",
	"_dors/Voiced_velar_approximant.mp3",
	"_dors/Voiced_velar_fricative.mp3",
	"_dors_glot_fric/Voiceless_glottal_fricative.mp3",
	"_dors_glot_fric/Voiceless_pharyngeal_fricative.mp3",
	"_dors_glot_fric/Voiceless_uvular_fricative.mp3",
	"_dors_glot_fric/Voiceless_velar_fricative.mp3",
	"_dors_stops/Voiced_palatal_plosive.mp3",
	"_dors_stops/Voiceless_palatal_plosive.mp3",
	"_dors_stops/Voiceless_uvular_plosive.mp3",
	"_dors_stops/Voiceless_velar_plosive.mp3",
	"_ejectives/Alveolar_ejective_plosive.mp3",
	"_ejectives/Bilabial_ejective_plosive.mp3",
	"_ejectives/Uvular_ejective_plosive.mp3",
	"_ejectives/Velar_ejective_plosive.mp3",
	"_epiglot/Voiced_epiglottal_fricative.mp3",
	"_epiglot/Voiced_glottal_fricative.mp3",
	"_epiglot/Voiceless_epiglottal_fricative.mp3",
	"_epiglot/Voiceless_glottal_fricative.mp3",
	"_lab_vel_cont/Labial-palatal_approximant.mp3",
	"_lab_vel_cont/Labiodental_approximant.mp3",
	"_lab_vel_cont/Velar_lateral_approximant.mp3",
	"_lab_vel_cont/Voiced_labio-velar_approximant.mp3",
	"_liquids/Alveolar_approximant.mp3",
	"_liquids/Alveolar_lateral_approximant.mp3",
	"_liquids/Retroflex_approximant.mp3",
	"_liquids/Retroflex_lateral_approximant.mp3",
	"_nasals/Alveolar_nasal.mp3",
	"_nasals/Palatal_nasal.mp3",
	"_nasals/Uvular_nasal.mp3",
	"_nasals/Velar_nasal.mp3",
	"_nas_vow/nasal_i.mp3",
	"_nas_vow/nasal_i_plus_n.mp3",
	"_nas_vow/oral_i.mp3",
	"_nas_vow/oral_i_plus_n.mp3",
	"_plos_phonation/Breathy_bilabial_stop.mp3",
	"_plos_phonation/Creaky_bilabial_stop.mp3",
	"_plos_phonation/Implosive_bilabial_stop.mp3",
	"_plos_phonation/Voiced_bilabial_stop.mp3",
	"_taps_trills/Alveolar_lateral_flap.mp3",
	"_taps_trills/Alveolar_tap.mp3",
	"_taps_trills/Alveolar_trill.mp3",
	"_taps_trills/Retroflex_flap.mp3",
	"_tones/Dipping.mp3",
	"_tones/Falling.mp3",
	"_tones/Peaking.mp3",
	"_tones/Rising.mp3",
	"_tones_v2/dipping.mp3",
	"_tones_v2/falling.mp3",
	"_tones_v2/peaking.mp3",
	"_tones_v2/rising.mp3",
	"_vowels1/Open-mid_back_rounded_vowel.mp3",
	"_vowels1/Open-mid_central_rounded_vowel.mp3",
	"_vowels1/Open-mid_front_rounded_vowel.mp3",
	"_vowels1/Open_front_rounded_vowel.mp3",
	"_vowels2/Close-mid_back_rounded_vowel.mp3",
	"_vowels2/Close-mid_central_rounded_vowel.mp3",
	"_vowels2/Close-mid_front_rounded_vowel.mp3",
	"_vowels2/Near-close_near-front_rounded_vowel.mp3",
	"_vowel_phonation/breathy_voice.mp3",
	"_vowel_phonation/creaky_voice.mp3",
	"_vowel_phonation/modal_voice.mp3",
	"_vowel_phonation/voiceless.mp3",
	"_intro/Alveolar_lateral_approximant.mp3",
	"_intro/Near-open_central_unrounded_vowel.mp3",
	"_intro/Voiced_alveolar_plosive.mp3",
	"_intro/Voiceless_postalveolar_fricative.mp3",
];

let sound_progression = [
	"_intro",
	"_ant_fric",
	"_plos_phonation",
	"_tones",
	"_vowel_phonation",
	"_taps_trills",//
	"_alv_v_ret",
	"_dors",
	"_ant_lab_vel_2",
	"_vowels2",
];


let sound_paths=[];
for (let i=0;i<sound_progression.length;i++){
	var dir = sound_progression[i];
	let grouping=[];
	//add all paths from sound_paths_flat to it that start with dir
	for (let j=0;j<sound_paths_flat.length;j++){
		if (sound_paths_flat[j].startsWith(dir)){
			grouping.push(sound_paths_flat[j]);
		}
	}
	
	sound_paths.push(grouping);
}

let soundgroups = [];
//load all sounds from sound_paths into sounds
for (let i = 0; i < sound_paths.length; i++) {
	let path_group = sound_paths[i];

	let group = [];

	for (let j = 0; j < path_group.length; j++) {
		group[j] = new Audio("samples/" + path_group[j]);
	}

	soundgroups.push(group);
}

let sounds = soundgroups[level];

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}



//playPattern coroutine
async function playPattern() {
	let max_duration = 0;//in seconds
	for (let i = 0; i < sounds.length; i++) {
		if (sounds[i].duration > max_duration) {
			max_duration = sounds[i].duration;
		}
	}

	let curtime = time;
	//loop throuhg pattern array
	for (let i = 0; i < sound_pattern.length; i++) {
		let sound = sounds[sound_pattern[i]];
		playAudio(sound);
		phase_1_abspiel_position = i;
		redraw();
		//wait max_duration ms
		await sleep(max_duration * 1000);
		if (time > curtime) {
			first_pattern_playthrough = false;
			return;
		}
	}
	phase_1_abspiel_position = -1;
	first_pattern_playthrough = false;
	redraw();
}

async function pressButton(button_index) {
	if (poweroff === true) {
		return;
	}

	if (runde_phase === 0) {
		playAudio(sounds[button_index]);
	} else if (runde_phase === 1) {
		runde_phase = 2;
		input_pattern = [button_index];
		playAudio(sounds[button_index]);
		redraw();
	} else if (runde_phase === 2) {
		input_pattern.push(button_index);
		playAudio(sounds[button_index]);
		if (input_pattern.length === PATTERN_LAENGE) {
			sequenz_spielend = true;
			//wait for duration of sounds[button_index]
			phase2_wait = true;
			let curtime = time;
			redraw();
			await sleep(sounds[button_index].duration * 1000);
			phase2_wait = false;
			if (time > curtime) {
				redraw();
				return;
			}
			if (input_pattern.toString() === sound_pattern.toString()) {
				playAudio(sfx["solve"]);
			} else {
				playAudio(sfx["fail"]);
			}
			redraw();
			for (let i = 0; i < 5; i++) {
				phase2_flash = (i % 2) === 0;
				if (time > curtime) {
					return;
				}
				redraw();
				await sleep(100);
				if (time > curtime) {
					return;
				}
			}
			redraw();
			sequenz_spielend = false;

			//check if input_pattern is correct
			if (input_pattern.toString() === sound_pattern.toString()) {
				if (level < LEVEL_ZAHL - 1) {
					level++;
					sounds = soundgroups[level];
					runde_phase = 0;
					generatePattern();
				} else {
					playAudio(sfx["win"]);
					winstate = true;
				}
			} else {
				if (level > 0) {
					level--;
				}
				sounds = soundgroups[level];
				runde_phase = 0;
				generatePattern();
			}
		}
		redraw();
	}
}

function doPress(i) {


	pressed[i] = true;

	if (sequenz_spielend === true) {
		redraw();
		return;
	}
	if (winstate) {
		redraw();
		return;
	}

	if (runde_phase === 1 && first_pattern_playthrough) {
		redraw();
		return;
	}
	time++;
	if (poweroff === false) {
		switch (i) {
			case 0:// button1
				//play the Audio sound[0]
				pressButton(i);
				break;
			case 1:// button2
				pressButton(i);
				break;
			case 2:// button3
				pressButton(i);
				break;
			case 3:// button4
				pressButton(i);
				break;
			case 4://play
				if (runde_phase === 2) {
					playAudio(sfx["error"]);
				} else {
					if (runde_phase !== 1) {
						runde_phase = 1;
						generatePattern();
					}
					//call coroutine playPattern()
					playPattern();

				}
				break;
		}
	}

	redraw();

	return Promise.resolve(1);
}

function getMousePos(evt) {
	let rect = canvas.getBoundingClientRect(), // abs. size of element
		scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
		scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

	let clientX = evt.clientX;
	let clientY = evt.clientY;

	if (scaleX < scaleY) {
		scaleX = scaleY;
		clientX -= rect.width / 2 - (cw / scaleX) / 2;
	} else {
		scaleY = scaleX;
		clientY -= rect.height / 2 - (ch / scaleY) / 2;
	}
	let x = (clientX - rect.left) * scaleX;   // scale mouse coordinates after they have
	let y = (clientY - rect.top) * scaleY     // been adjusted to be relative to element

	return [x, y];
}

let target = -1;


function handleUntap(e) {
	if (target >= 0) {
		pressed[target] = false;
		target = -1;
		redraw();
	}
}

function resetGame() {
	winstate = false;
	level = 0;
	runde_phase = 0;
	phase_1_abspiel_position = -1;
	sound_pattern = [];
	sounds = soundgroups[level];
}

function handleTap(e) {

	let [mouseX, mouseY] = getMousePos(e);

	for (let i = 0; i < image_x_y.length; i++) {
		let dat = image_x_y[i];
		let x_min = dat[1];
		let y_min = dat[2];
		let x_max = dat[1] + dat[3];
		let y_max = dat[2] + dat[4];

		if (mouseX >= x_min && mouseX <= x_max && mouseY >= y_min && mouseY <= y_max) {

			if (target >= 0) {
				pressed[target] = 0;
			}
			target = i;

			doPress(i);
		}
	}

	if (mouseX >= 10 && mouseY >= 12 && mouseX <= 18 && mouseY <= 16) {
		poweroff = !poweroff;
		time++;
		if (poweroff) {
			for (let i = 0; i < sounds.length; i++) {
				sounds[i].pause();
			}
			playAudio(sfx["power_off"]);
		} else {
			playAudio(sfx["power_on"]);
			resetGame();
		}
		redraw();
	}

}
function neighbors(x, y) {
	let result = [];
	if (x > 0) {
		result.push([x - 1, y]);
	}
	if (x < gw - 1) {
		result.push([x + 1, y]);
	}
	if (y > 0) {
		result.push([x, y - 1]);
	}
	if (y < gh - 1) {
		result.push([x, y + 1]);
	}
	return result;
}

canvas.addEventListener("pointerdown", handleTap);
canvas.addEventListener("pointerup", handleUntap);

resetGame();