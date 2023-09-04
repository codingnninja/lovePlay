'use strict'

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

/**All music information */
const songs = [
  {
    id:1,
    backgroundImage: "./assets/images/local-poster-1.jpg",
    posterUrl: "./assets/images/local-poster-1.png",
    title: "Calm Down",
    album: "Audio",
    year: 2023,
    artist: "Rema ft Gomez",
    musicPath: "https://cdn.tunezjam.com/video/Rema-Ft-Selena-Gomez-Calm-Down-Video-(TunezJam.com).mp4",
  },
  {
    id:2,
    backgroundImage: "assets/images/local-poster-2.jpg",
    posterUrl: "assets/images/local-poster-2.jpg",
    title: "Lonely at the top ",
    album: "Audio",
    year: 2023,
    artist: "Asake",
    musicPath: "https://cdn.trendybeatz.com/audio/Asake-Lonely-At-The-Top-(TrendyBeatz.com).mp3",
  },
  {
    id:3,
    backgroundImage: "./assets/images/local-poster-3.jpg",
    posterUrl: "./assets/images/local-poster-3.jpg",
    title: "Unavailable",
    album: "Audio",
    year: 2023,
    artist: "Davido ft Musa",
    musicPath: "https://cdn.trendybeatz.com/audio/Davido-Ft-Musa-Keys-Unavailable-New-Song-(TrendyBeatz.com).mp3",
  }
];

const Player = () => {
  return `
      <div class="player" id="player">
        <CurrentSong />
      </div>
  `;
}
const Playlist = () => {
  return `
      <div class="playlist" data-playlist id="playlist">
        <Songs mySongs=${stringify(songs)}/>
      </div>
  `;
}
const Overlay = () => {
  return `
      <div class="overlay" data-playlist-toggler data-overlay></div>
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
    <audio src=${song.musicPath} id="audio-${song.id}" data-id="${song.id}" onEnded="autopilotMode(this, '${stringify(song)}')" onloadeddata="$trigger(${updateDuration}, '#audio-${song.id},#seek-${song.id}, #duration')"></audio>
    <figure class="music-banner">
    <img
      src="${song.posterUrl}"
      width="800"
      height="800"
      alt="Wotakoi: Love is Hard for an Otaku Album Poster"
      class="img-cover"
      data-player-banner
    />
  </figure>

  <div class="music-content">
    <h2 class="headline-sm" data-title>
      ${song.title}
    </h2>

    <p class="label-lg label-wrapper wrapper">
      <span data-album>${song.album}</span>
      <span data-year>${song.year}</span>
    </p>

    <p class="label-md artist" data-artist>${song.artist}</p>
    <SeekControl song=${stringify(song)} />
    <Controller song=${stringify(song)} />
  </div>
  `;
}

const SeekControl = (song) => {
  console.log(song)
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
      <button class="btn-icon volume-btn" data-volume-btn>
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
          data-range
          data-seek
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
          data-range
          data-seek
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
  console.log(index);
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
  return songs.map(mySong => {
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
  const songList = setPlayingState(song);
  $render(Songs, songList);
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
    <button class="btn-icon" data-skip-prev>
      <span class="material-symbols-rounded"
        onclick="$trigger(${previous}, '#audio-${song.id}', ${index - 1})"
      >skip_previous</span>
    </button>
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
    <div id="next">
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

const Audio = (song) => {
  return `
    <div id="${song.id}">
      <button 
        class="music-item ${song.isPlaying ? 'playing' : ''}"
        id='playing-${song.id}' 
        onclick="$trigger(${playSelectedSong}, '#audio-${song.id}', ${song.id - 1})">
          <img src="${song.posterUrl}" width="800" height="800" alt="${song.title} Album Poster"
          class="img-cover">
          <div class="item-icon">
            <span class="material-symbols-rounded">equalizer</span>
          </div>
      </button>
    </div>
  `;
}
const Songs = (mySongs) => {
  const songList = mySongs.map((song) =>`<Audio song=${stringify(song)} />`);
  return `
    <div class="music-list" id="music-list">
      ${songList}
    </div>`;
}
const App = () => {
  return `
    <div id="main">
      <article>
          <Player />
          <Playlist />
          <Overlay />
      </article>
    </div>
  `;
}

$render(App);

//TODO: update $trigger, add purify to single render prop