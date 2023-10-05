'use strict'

const {$render, stringify, $select, $trigger, $purify} = render;

let playerSeekRange;
let playerDuration;
let playingAudio;
let playerRunningTime;
let playingInterval;

const appState = {
  repeat: false,
  shuffle: null,
  selected: false,
  volume: null
}

const Player = () => {
  return `
      <div class="player" id="player">
        <CurrentSong />
      </div>
  `;
}
const Playlist = () => {
  return `
      <div class="playlist" id="playlist">
        <Songs mySongs=${stringify(songs)}/>
      </div>
  `;
}
const Overlay = () => {
  return `
      <div class="overlay" onclick="$trigger(${toggle})">
        <span class="close">x</span>
      </div>
  `;
}
const CurrentSong = (currentSong) => {
  const song = currentSong ? currentSong : songs[0];
  return `
    <div class="container" id="playing-song">
      <CurrentSongInformation song=${stringify(song)}/>
    </div>
  `;
}

const getTimecode = function (duration) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.ceil(duration - (minutes * 60));
  const timecode = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  return timecode;
}

const updateDuration = (elements) => {
  playerSeekRange = elements[1];
  playerDuration = elements[2];
  playerSeekRange.max = Math.ceil(elements[0].duration);
  playerDuration.textContent = getTimecode(Number(playerSeekRange.max));
}

const CurrentSongInformation = (song) => {
  return `
    <audio src=${song.musicPath} id="audio-${song.id}" data-id="${song.id}" onEnded="autopilotMode(this, '${stringify(song)}')" onloadeddata="$trigger(${updateDuration}, '#audio-${song.id},#seek-${song.id}, #duration')" class="playing-audio"></audio>
    <figure class="music-banner">
    <img
      src="${song.posterUrl}"
      width="800"
      height="800"
      alt="Wotakoi: Love is Hard for an Otaku Album Poster"
      class="img-cover"
    />
  </figure>

  <div class="music-content">
    <h2 class="headline-sm">
      ${song.title}
    </h2>

    <p class="label-lg label-wrapper wrapper">
      <span>${song.album}</span>
      <span>${song.year}</span>
    </p>

    <p class="label-md artist">${song.artist}</p>
    <SeekControl song=${stringify(song)} />
    <Controller song=${stringify(song)} />
  </div>
  `;
}

const SeekControl = (song) => {
  return `
    <div class="seek-control">
      <ProgressIndicator song=${stringify(song)} />
      <Volume song=${stringify(song)}/>
    </div>
  `;
}

const resolveVolume = (audio, song) => {
  if(appState.volume === null){
    return;
  }
  audio.volume = appState.volume;
  song.volume = appState.volume;
  $render(Volume, song);
}
const changeVolume = function (elements) {
  const audio = elements[0];
  audio.volume = elements[1].value;
  audio.muted = false;

  appState.volume = elements[1].value;

  if(audio.volume <= 0.1) {
    elements[2].textContent = 'volume_mute';
  } else if(audio.volume <= 0.5) {
    elements[2].textContent = 'volume_down';
  } else {
    elements[2].textContent = 'volume_up';
  } 
}
const Volume = (song) => {
  const volume = song.volume ? song.volume : 1;
  return `
    <div class="volume" id="volume">
      <button class="btn-icon volume-btn">
        <span class="material-symbols-rounded" id="volume-icon">volume_up</span>
      </button>

      <div class="range-wrapper">
        <input
          type="range"
          step="0.05"
          max="1"
          value="${volume}"
          class="range"
          id="volume-${song.id}"
          onchange="$trigger(${changeVolume}, '#audio-${song.id}, #volume-${song.id}, #volume-icon')"
        />

        <div class="range-fill"></div>
      </div>
    </div>
  `;
}

const updateRunningTime = (song) => {
  const [playingAudio, playerSeekRange, playerRunningTime] = $select( `#audio-${song.id}, #running-time, #seek-${song.id}`);
  playerSeekRange.value = playingAudio.currentTime;
  playerRunningTime.textContent = getTimecode(playingAudio.currentTime);
}

const seek = (elements) => {
  elements[0].currentTime = elements[2].value;
  elements[1].textContent = getTimecode(elements[2].value);

  const rangeValue = (elements[2].value / elements[2].max) * 100;
  elements[3].style.width = `${rangeValue}%`;
}

const ProgressIndicator = (song) => {
  return `
    <div class="progress-indicator" id="progress-indicator">
      <div class="range-wrapper">
        <input
          type="range"
          step="1"
          max="60"
          value="0"
          class="range"
          id="seek-${song.id}"
          onchange="$trigger(${seek}, '#audio-${song.id},#running-time, #seek-${song.id}, #range-fill')"
        />

        <div class="range-fill" id="range-fill"></div>
      </div>

      <div class="duration-label wrapper">
        <span class="label-md" id="running-time">0:00</span>
        <span class="label-md" id="duration">1:00</span>
      </div>
    </div>
  `;
}

const getRandomSong = () => songs[Math.floor(Math.random() * songs.length)]

const playSelectedSong = (element, index) => {
  appState.selected = true;
  const selectedSong = getSong(index, element);
  setToPlaying(selectedSong);
  $render(Repeat)
}
const getSong = (index) => {
  let nextSong;
  if(appState.shuffle && appState.selected === false){
    nextSong = getRandomSong();
    nextSong.isShuffled = true;
    $render(CurrentSong, nextSong);
    $render(Shuffle)

  } else if(!songs[index]){
    nextSong = songs[0];
    $render(CurrentSong, nextSong);

  } else {
    nextSong = songs[index];
    $render(CurrentSong, nextSong);
  }
  return nextSong;
}

const setPlayingState = (song) => {
  getSelectedSongsForDownload();
  return songs.map((mySong, index) => { 
    if(mySong.id === song.id){
      mySong.isPlaying = true;
    } else {
      mySong.isPlaying = false;
    }
    return mySong;
  });
}

const setToPlaying = (song) => {
  if(!song) {
    return
  }
  song.isPlaying = true;
  $trigger(play, `#audio-${song.id}`, song);
}

const previous = (element, previousIndex) => {
  appState.selected = false;
  const previousSong = getSong(previousIndex, element);
  setToPlaying(previousSong);
  $render(Repeat)
}

const Previous = (song) => {
  const index = song.id - 1;
  return `
    <div id="previous" data-index="${index - 1}">
      <button class="btn-icon">
        <span class="material-symbols-rounded"
          onclick="$trigger(${previous}, '#audio-${song.id}', ${index - 1})"
        >skip_previous</span>
      </button>
    </div>
  `;
}

//play controller
const play = (audio, song) => {
  clearInterval(playingInterval);
  song.isPlaying = true;
  resolveVolume(audio, song);
  audio.play();
  $render(Play, song);
  $render(Songs, setPlayingState(song));
  playingInterval = setInterval( function(){updateRunningTime(song)}, 500); 
}

const pause = (audio, song) => {
  song.isPlaying = false;
  audio.pause();
  $render(Play, song);
  clearInterval(playingInterval);
}

//play view 
const Play = (song) => {
  return `
    <div id="play">
      <button class="btn-icon play ${song.isPlaying ? 'play-active': ''}">
        <span class="material-symbols-rounded default-icon"
          onclick="$trigger(${song.isPlaying ? pause : play}, '#audio-${song.id}', '${stringify(song)}')">
            ${song.isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>
    </div>
  `;
}

//next controller
const next = (element, nextIndex) => {
  appState.selected = false;
  const nextSong =  getSong(nextIndex, element);
  setToPlaying(nextSong);
  $render(Repeat)
}
//next view

const Next = (song) => {
  const index = song.id - 1;
  return `
    <div id="next" data-index="${index + 1}">
      <button class="btn-icon">
        <span 
          class="material-symbols-rounded"
          onclick="$trigger(${next}, '#audio-${song.id}', ${index + 1})"
        >skip_next</span>
      </button>
    </div>
  `;
}

const shuffle = () => {
  appState.shuffle = appState.shuffle ? false: true;
  $render(Shuffle);
}

const Shuffle = () => {
  return `
    <div id="shuffle">
      <button class="btn-icon toggle">
        <span 
          class="material-symbols-rounded ${appState.shuffle  ? 'active': ''}"
          onclick="$trigger(${shuffle})"
        >shuffle</span>
      </button>
    </div>
  `;
}

const repeat = () => {
  appState.repeat = appState.repeat ? false: true;
  $render(Repeat);
}
const autopilotMode = (audio, song) => {
  const currentSong = $purify(song);
  if(appState.repeat) {
    audio.currentTime = 0;
    audio.play(); 
    return; 
  } 
  next(audio, currentSong.id);
}

const Repeat = () => {
  return `
    <div id="repeat">
      <button class="btn-icon toggle">
        <span 
          class="material-symbols-rounded ${appState.repeat ? 'active' : ''}"
          onclick="$trigger(${repeat})"
        >
        ${appState.repeat ? 'repeat_one' : 'repeat'}
        </span>
      </button>
    </div>
  `;
}

const Controller = (song) => {
    return `
      <div class="player-control wrapper">
        <Repeat />
        <Previous song=${stringify(song)} />
        <Play song=${stringify(song)} />
        <Next song=${stringify(song)} />
        <Shuffle />                 
      </div>
    `;
}

const unCheckSong = (song) => {
  console.log(song.checked);
  if(song.checked === false){
    song.checked = false;
    return;
  }
}
const Audio = (song) => {
  const songId = song.id;
  return `
    <div id="${song.id}">
      <input type="checkbox" name="select-song" id="check-${songId}"     class="selected-songs" ${ song.isChecked ? 'checked' : ''}>
      <button 
        class="music-item ${song.isPlaying ? 'playing' : ''}"
        id='playing-${song.id}' 
        onclick="$trigger(${playSelectedSong}, '#audio-${song.id}', ${song.id - 1})">
          <img src="${song.posterUrl}" width="800" height="800" alt="${song.title} Album Poster"
          class="img-cover">
          <div class="item-icon">
            <span class="material-symbols-rounded">equalizer</span>
          </div>
          <div class="song-details">
          <span id="title">${song.title}</span>
            <span id="date">${song.month} (${song.year})</span>
          </div>
      </button>
    </div>
  `;
}

const getSelectedSongsForDownload = () => {
  const selectedSongsIDs = $select('.selected-songs');
  const selectedSongs = songs.map((song, index) => {
    if(selectedSongsIDs[index].checked === true){
      song.isChecked = true;
      return song;
    }
    song.isChecked = false;
    return song;
  });
  return selectedSongs;
}

const downloadAll = () => {
  const selectedSongs = getSelectedSongsForDownload();
  const [errorMsg] = $select('#selection-error');

  if(selectedSongs.length === 0){
    errorMsg.classList.add('show');
    return;
  } else {
    errorMsg.classList.remove('show');
  }

  let depth = 0;
  while(selectedSongs.length > depth){
    const selectedSong = selectedSongs[depth];
    if(!selectedSong.isChecked){
      continue;
    }
    const link = document.createElement("a");
    link.href = selectedSong.musicPath;
    link.download = `${selectedSong.musicPath}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    depth++;
  }
}
const Songs = (mySongs) => {
  const songList = mySongs.map((song) =>`<Audio song=${stringify(song)} />`);
  return `
    <div class="music-list" id="music-list">
      <div 
        style="border: 1px solid silver; text-align:center; border-radius: 8px"
        onclick="$trigger(downloadAll)"
      >
        <span class="material-symbols-rounded active">download</span> all
      </div>
        <span id="selection-error">No song selected</span>
      ${songList}
    </div>`;
}

const toggle = (event) => {
  event && event.preventDefault();
  const [playlist, overlay] = $select('#playlist, .overlay');
  if(playlist.classList.contains('active')){
    playlist.classList.remove('active');
    overlay.classList.remove('active');
  } else {
    playlist.classList.add('active');
    overlay.classList.add('active');
  }
};
const Header = () => {
  return `
    <div class="top-bar wrapper">
      <!--navbar-->
      <div class="logo wrapper">
        <h1 class="title-lg">LovePlay</h1>
      </div>
      <!--music list-->
      <div class="top-bar-actions">
        <button class="btn-icon" onclick="$trigger(toggle)">
          <span class="material-symbols-rounded">filter_list</span>
        </button>
      </div>
    </div>
  `;
}
const App = () => {
  return `
    <div id="main">
      <Header />
      <article>
          <Player />
          <Playlist />
          <Overlay />
      </article>
    </div>
  `;
}

$render(App);

// Swiping implementation
let [touchArea, overlay] = $select("#player, #overlay");
const debounce = (func, timeout=300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(()=> {func.apply(this, args)}, timer);
  }
}

const handlePrevious = debounce(() => {
  let [previousComponent] = $select("#previous");
  const previousSongIndex = previousComponent.dataset.index;
  const currentSong = $select(`#audio-${previousSongIndex + 1}`);
  previous(currentSong, previousSongIndex);
});

const handleNext = debounce (() => {
  let [nextComponent] = $select("#next");
  const nextSongIndex = nextComponent.dataset.index;
  const currentSong = $select(`#audio-${nextSongIndex - 1}`);
  next(currentSong, nextSongIndex);
});
//Initial mouse X and Y positions are 0

let mouseX,
  initialX = 0;
let mouseY,
  initialY = 0;
let isSwiped;

//Events for touch and mouse
let events = {
  mouse: {
    down: "mousedown",
    move: "mousemove",
    up: "mouseup",
  },
  touch: {
    down: "touchstart",
    move: "touchmove",
    up: "touchend",
  },
};

let deviceType = "";

//Detect touch device

const isTouchDevice = () => {
  try {
    //We try to create TouchEvent (it would fail for desktops and throw error)
    document.createEvent("TouchEvent");
    deviceType = "touch";
    return true;
  } catch (e) {
    deviceType = "mouse";
    return false;
  }
};

//Get left and top of touchArea
let rectLeft = touchArea.getBoundingClientRect().left;
let rectTop = touchArea.getBoundingClientRect().top;

//Get Exact X and Y position of mouse/touch
const getXY = (e) => {
  mouseX = (!isTouchDevice() ? e.pageX : e.touches[0].pageX) - rectLeft;
  mouseY = (!isTouchDevice() ? e.pageY : e.touches[0].pageY) - rectTop;
};

isTouchDevice();

//Start Swipe
touchArea.addEventListener(events[deviceType].down, (event) => {
  isSwiped = true;
  //Get X and Y Position
  getXY(event);
  initialX = mouseX;
  initialY = mouseY;
});

//Mousemove / touchmove
touchArea.addEventListener(events[deviceType].move, (event) => {
  if (!isTouchDevice()) {
    event.preventDefault();
  }
  if (isSwiped) {
    getXY(event);
    let diffX = mouseX - initialX;
    let diffY = mouseY - initialY;
    if (Math.abs(diffY) > Math.abs(diffX)) {
      diffY > 0 ? toggle(event) : toggle(event);
    } else {
      if(event.target.classList[0] === "range"){
        return;
      }
      diffX > 0 ? handlePrevious()  : handleNext();
    }
  }
});

//Stop Drawing
touchArea.addEventListener(events[deviceType].up, () => {
  isSwiped = false;
});

touchArea.addEventListener("mouseleave", () => {
  isSwiped = false;
});

window.onload = () => {
  isSwiped = false;
};


//TODO: update $trigger, add purify to single render prop