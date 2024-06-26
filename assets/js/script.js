'use strict'

import { $render, $register, stringify, $select, $purify } from "https://cdn.jsdelivr.net/npm/@codingnninja/render/dist/esm/render.min.js";
let playingInterval;

/**All music information */
const songs = [
    {
      id:1,
      posterUrl: "./assets/images/calm-down.png",
      title: "Calm Down",
      album: "Audio",
      year: 2023,
      artist: "Rema ft Gomez",
      musicPath: "./assets/music/local-music-2.mp3",
    },
    {
      id:2,
      posterUrl: "./assets/images/lonely-at-the-top.jpg",
      title: "Lonely at the top ",
      album: "Audio",
      year: 2023,
      artist: "Asake",
      musicPath: "./assets/music/local-music-1.mp3",
    },
    {
      id:3,
      posterUrl: "./assets/images/unavailable.jpg",
      title: "Unavailable",
      album: "Audio",
      year: 2023,
      artist: "Davido ft Musa",
      musicPath: "./assets/music/local-music-3.mp3",
    }
  ];
  
  const getSong = async (index) => {
    let song;
    let completed;
    if(appState.shuffle && appState.selected === false){
      const getRandomSong = () => appState.songs[Math.floor(Math.random() * appState.songs.length)]
      song = getRandomSong();
      song.isShuffled = true;
      $render(Shuffle)
      completed = await $render(CurrentSong, {song});
  
    } else if(!appState.songs[index]){
      song = appState.songs[0];
      completed = await $render(CurrentSong, {song});
  
    } else {
      song = appState.songs[index];
      completed = await $render(CurrentSong, {song});
    }
    if(completed){
      $render(Play, {song});
    }
  }
const getSelectedSongsForDownload = () => {
  const selectedSongsIDs = $select('.selected-songs');
  const selectedSongs = appState.songs.map((song, index) => {
    if(selectedSongsIDs[index].checked === true){
      song.isChecked = true;
      return song;
    }
    song.isChecked = false;
    return song;
  });
  return selectedSongs;
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

const getTimecode = function (duration) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.ceil(duration - (minutes * 60));
  const timecode = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  return timecode;
}
const updateRunningTime = (song) => {
  const [playingAudio, playerSeekRange, playerRunningTime, rangeFill] = $select( `#audio-${song.id}, #seek-${song.id}, #running-time, #range-fill`);

  if(Math.floor(playingAudio.currentTime) === appState.range.end){
    if(!appState.repeat){
      appState.range.end = playingAudio.duration;
    }
    appState.autopilotMode(playingAudio, song);   
  }

  playerSeekRange.value = playingAudio.currentTime;
  playerRunningTime.textContent = appState.getTimecode(playingAudio.currentTime);
  const rangeValue = (playerSeekRange.value / playerSeekRange.max) * 100;
  rangeFill.style.width = `${rangeValue}%`;
}

const resolveVolume = (audio, song) => {
  if(appState.volume === null){
    return;
  }
  audio.volume = appState.volume;
  song.volume = appState.volume;
  $render(Volume, {song});
}

const playSelectedSong = (element, index) => {
  appState.selected = true;
  const selectedSong = appState.getSong(index, element);
  setToPlaying(selectedSong);
  $render(Repeat)
}
const autopilotMode = (audio, song) => {
  const currentSong = typeof song === 'string' ? $purify(song) : song;
  if(appState.repeat) {
    audio.currentTime = appState.range.start;
    audio.play(); 
    return true; 
  } 
  appState.getSong(currentSong.id);
}

const appState = {
  played: false,
  songs,
  getSong,
  autopilotMode,
  playSelectedSong,
  resolveVolume,
  setPlayingState,
  playingInterval,
  updateRunningTime,

  getTimecode,
  getSelectedSongsForDownload,
  repeat: false,
  shuffle: null,
  selected: false,
  volume: null,
  range: {
    start: 0,
    end: null
  }
}

const Player = ({songs}) => {
  return `
      <div class="player" id="player">
        <CurrentSong song={songs[0]} />
      </div>
  `;
}
const Playlist = ({songs}) => {
  return `
      <div class="playlist" id="playlist">
        <Songs songs=${stringify(songs)}/>
      </div>
  `;
}
const Overlay = ({toggle}) => {
  return `
      <div class="overlay" onclick="$trigger(${toggle})">
        <span class="close">x</span>
      </div>
  `;
}
const CurrentSong = ({song}) => {
  return `
    <div class="container" id="playing-song">
      <CurrentSongInformation 
        song="{song}" 
      />
    </div>
  `;
}
const CurrentSongInformation = ({song}) => {
  const updateDuration = (elements) => {
    const [audio,  playerSeekRange, endRange, playerDuration ] = elements;
    playerSeekRange.max = Math.ceil(audio.duration);
    endRange.max = playerSeekRange.max;
    endRange.value = playerSeekRange.max;
    appState.range.end = playerSeekRange.max;
    playerDuration.textContent = appState.getTimecode(Number(playerSeekRange.max));
  }
  return `
    <audio src=${song.musicPath} id="audio-${song.id}" data-id="${song.id}" onEnded="appState.autopilotMode(this, '${stringify(song)}')" onloadeddata="$trigger(${updateDuration}, '#audio-${song.id},#seek-${song.id}, #seek-right-${song.id}, #duration')" class="playing-audio"></audio>
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
    <SeekControl song={song} />
    <Controller song={song} />
  </div>
  `;
}

const SeekControl = ({song}) => {
  return `
    <div class="seek-control">
      <ProgressIndicator song=${stringify(song)} />
      <Volume song=${stringify(song)}/>
    </div>
  `;
}
const Volume = ({song}) => {
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

const ProgressIndicator = ({song}) => {

  const seek = (elements) => {
    const [audio, runningTime, seekRange, rangeFill] = elements;
    audio.currentTime = seekRange.value;
  
    appState.range.start = Number(seekRange.value); 
    runningTime.textContent = appState.getTimecode(appState.range.start);
  
    const rangeValue = (seekRange.value / seekRange.max) * 100;
    rangeFill.style.width = `${rangeValue}%`;
  }

  const seekRight = (elements) => {
    const [duration, seekRangeRight, fillRight] = elements;
    const rangeValue = (seekRangeRight.value/seekRangeRight.max) * 100;
    
    appState.range.end = Number(seekRangeRight.value); 
    appState.range.elements = elements; 
    duration.textContent = appState.getTimecode(appState.range.end);
  
    const rangeRightValue = 100 - rangeValue;
    fillRight.style.width = `${rangeRightValue}%`;
  }

  return `
    <div class="progress-indicator" id="progress-indicator">
      <div class="range-wrapper">
        <input
          type="range"
          class="duel-range right-range"
          min="0"
          max="60"
          value="60"
          step="1"
          id="seek-right-${song.id}"
          onchange="$trigger(${seekRight}, '#duration, #seek-right-${song.id}, #fill-right')"
        />
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
        <div class="fill-right" id="fill-right"></div>
      </div>

      <div class="duration-label wrapper">
        <span class="label-md" id="running-time">0:00</span>
        <span class="label-md" id="duration">1:00</span>
      </div>
    </div>
  `;
}

const Previous = ({song}) => {
  const index = song.id - 1;
  return `
    <div id="previous">
      <button class="btn-icon">
        <span class="material-symbols-rounded"
          onclick="appState.getSong(${index - 1})"
        >skip_previous</span>
      </button>
    </div>
  `;
}
const Play = ({song, event}) => {
  const audio = $select(`#audio-${song.id}`); 
  const props = {song};
  clearInterval(appState.playingInterval);

  if(audio){
    song.isPlaying = audio.paused ? true : false; 
    appState.resolveVolume(audio, song);
    appState.played = true;
    audio.paused ? audio.play() : audio.pause();
    $render(Songs, {songs: appState.setPlayingState(song)})
    if(song.isPlaying){
      appState.playingInterval = setInterval(function(){ appState.updateRunningTime(song)}, 500);
    }
  }

  return `
    <div id="play">
      <button class="btn-icon play ${song.isPlaying ? 'play-active': ''}" onclick="$render(Play, {props})" id="play-test">
        <span class="material-symbols-rounded default-icon">
            ${song.isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>
    </div>
  `;
}

const Next = ({song}) => {
  return `
    <div id="next">
      <button class="btn-icon">
        <span 
          class="material-symbols-rounded"
          onclick="appState.getSong(${song.id})"
        >skip_next</span>
      </button>
    </div>
  `;
}

const Shuffle = () => {
  const shuffle = () => {
    appState.shuffle = appState.shuffle ? false: true;
    $render(Shuffle);
  }

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

const Repeat = () => {
  const repeat = () => {
    appState.repeat = appState.repeat ? false: true;
    $render(Repeat);
  }

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

const Controller = ({song}) => {
    return `
      <div class="player-control wrapper">
        <Repeat />
        <Previous song=${stringify(song)} />
        <Play song={song} />
        <Next song=${stringify(song)} />
        <Shuffle />                 
      </div>
    `;
}

const unCheckSong = (song) => {
  if(song.checked === false){
    song.checked = false;
    return;
  }
}
const Audio = ({song}) => {
  const songId = song.id;
  
  return `
    <div id="${song.id}">
      <input type="checkbox" name="select-song" id="check-${songId}"     class="selected-songs" ${ song.isChecked ? 'checked' : ''}>
      <button 
        class="music-item ${song.isPlaying ? 'playing' : ''}"
        id='playing-${song.id}' 
        onclick="$trigger(${appState.playSelectedSong}, '#audio-${song.id}', ${song.id - 1})">
          <img src="${song.posterUrl}" width="800" height="800" alt="${song.title} Album Poster"
          class="img-cover">
          <div class="item-icon">
            <span class="material-symbols-rounded">equalizer</span>
          </div>
          <div class="song-details">
          <span id="title">${song.title}</span>
            <span id="date">${song.artist } (${song.year})</span>
          </div>
      </button>
    </div>
  `;
}
const Songs = ({songs}) => {
  const downloadAll = () => {
    const selectedSongs = getSelectedSongsForDownload();
    const errorMsg = $select('#selection-error');

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

  const songList = songs.map((song) =>`<Audio song=${stringify(song)} />`);
  return `
    <div class="music-list" id="music-list">
      <div 
        style="border: 1px solid silver; text-align:center; border-radius: 8px"
        onclick="$trigger(${downloadAll})"
      >
        <span class="material-symbols-rounded active">download</span> all
      </div>
        <span id="selection-error">No song selected</span>
      ${songList}
    </div>`;
}

const debounce = (func, timeout=50) => {
  let timer;
  return (...args) => {
    clearTimeout(timeout);
    const deferred = () => {
      timer = null;
      func(...args);
    };
    timer && clearTimeout(timer);
    timer = setTimeout(deferred, timeout);
  }
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
}

const Header = ({toggle}) => {
  return `
    <div class="top-bar wrapper">
      <!--navbar-->
      <div class="logo wrapper">
        <h1 class="title-lg">LovePlay</h1>
      </div>
      <!--music list-->
      <div class="top-bar-actions">
        <button class="btn-icon" onclick="$trigger(${toggle})">
          <span class="material-symbols-rounded">filter_list</span>
        </button>
      </div>
    </div>
  `;
}
const App = ({songs, toggle}) => {
  return `
    <div id="main">
      <Header toggle=${toggle} />
      <article>
        <Playlist songs={songs} />
        <Player songs={songs} />
        <Overlay toggle=${toggle} />
      </article>
    </div>
  `;
}


$register(
    Header, Player, Playlist, Play, CurrentSong,
    CurrentSongInformation, SeekControl, ProgressIndicator, Volume, Controller, Repeat, Previous, Next, Shuffle, Songs, Audio, Overlay
)

globalThis['appState'] = appState;

const a = await $render(App, {songs, toggle});
console.log(a);


if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){ 
  // Swiping implementation
  let [touchArea, overlay] = $select("#player, #overlay");

  const doNothing = () => {
  return;
  }

  const handlePrevious = debounce(() => {
    if(!appState.played) {
      alert('You must play before you swipe');
      return false
    }
    let previousComponent = $select("#previous>button>span");
    previousComponent.click();
  });

  const handleNext = debounce (() => {
    if(!appState.played) {
      alert('You must play before you swipe');
      return false
    }
    let nextComponent = $select("#next>button>span");
    nextComponent.click();
  });

  const togglePlaylistBySwipingDown = debounce((event) => {
    toggle();
  })
  //Initial mouse X and Y positions are 0

let startX = 0;
let startY = 0;
let threshold = 100; // Minimum distance to swipe

function handleTouchStart(event) {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
}

function handleTouchMove(event) {

    let currentX = event.touches[0].clientX;
    let currentY = event.touches[0].clientY;
    let diffX = startX - currentX;
    let diffY = startY - currentY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if(event.target.classList[0] === "range" || event.target.classList[0] === "duel-range"){
          return false;
        }
        
        if (diffX > threshold) {
            // Swipe left
            handleNext();
        } else if (diffX < -threshold) {
            // Swipe right
            handlePrevious();
        }
    } else {
        // Vertical swipe
        if (diffY > threshold) {
            // Swipe up
            doNothing();
        } else if (diffY < -threshold) {
            // Swipe 
            togglePlaylistBySwipingDown();
        }
    }
}

function handleTouchEnd(event) {
    // Reset startX and startY
    startX = 0;
    startY = 0;
}

touchArea.addEventListener("touchstart", handleTouchStart, {passive: true});
touchArea.addEventListener("touchmove", handleTouchMove, {passive: true});
touchArea.addEventListener("touchend", handleTouchEnd, {passive: true});
}
