import type { ScaleName, StationId } from '@infinite-radio/shared'

import { LOW_END_TRACKS } from './low-end'
import { VELVET_TRACKS } from './velvet'
import { VAPORWAVE_TRACKS } from './vaporwave'
import { INDIE_TRACKS } from './indie'

/**
 * Catalog of real recordings that steer each station's generative output.
 *
 * Only metadata (title, artist, year) plus character traits is stored:
 * key, mode, and energy readings that nudge the composition engine. No
 * audio and no expressive material from the referenced recordings is
 * used; the engine composes original music in their spirit.
 */
export interface TrackSeed {
  title: string
  artist: string
  year: number
  /** Tonic pitch class 0..11 (0 = C), as heard in the recording. */
  keyRootPc: number
  /** Modal color of the recording. */
  scale: ScaleName
  /** Energy 0..1. */
  energy: number
  /** Tonal brightness 0..1. */
  brightness: number
  /** Rhythmic and harmonic movement 0..1. */
  movement: number
  /** Optional rhythmic displacement used by groove-based stations. */
  swing?: number
  /** Optional percussion density; defaults to movement. */
  rhythmicDensity?: number
  /** Optional filtered texture preference; defaults to brightness. */
  texture?: number
}

function t(
  title: string,
  artist: string,
  year: number,
  keyRootPc: number,
  scale: ScaleName,
  energy: number,
  brightness: number,
  movement: number,
): TrackSeed {
  return { title, artist, year, keyRootPc, scale, energy, brightness, movement }
}

/** Weightless reference library: ambient, drone, and spacious recordings. */
const WEIGHTLESS_TRACKS: TrackSeed[] = [
  t('1/1', 'Brian Eno', 1978, 0, 'major', 0.25, 0.45, 0.2),
  t('An Ending (Ascent)', 'Brian Eno', 1983, 2, 'dorian', 0.2, 0.5, 0.15),
  t('Deep Blue Day', 'Brian Eno', 1983, 4, 'mixolydian', 0.3, 0.55, 0.3),
  t('First Light', 'Harold Budd & Brian Eno', 1980, 5, 'major', 0.2, 0.4, 0.2),
  t('Rhubarb', 'Aphex Twin', 1994, 10, 'naturalMinor', 0.15, 0.3, 0.1),
  t('Requiem for Dying Mothers', 'Stars of the Lid', 2001, 9, 'naturalMinor', 0.15, 0.25, 0.1),
  t('Piano Drop', 'Stars of the Lid', 2007, 3, 'naturalMinor', 0.2, 0.35, 0.15),
  t('Breathturn', 'Hammock', 2006, 4, 'naturalMinor', 0.3, 0.5, 0.3),
  t('Eingya', 'Helios', 2006, 2, 'major', 0.35, 0.55, 0.35),
  t("Heavy Water / I'd Rather Be Sleeping", 'Grouper', 2008, 9, 'naturalMinor', 0.1, 0.2, 0.1),
  t('Chimeras', 'Tim Hecker', 2006, 6, 'naturalMinor', 0.35, 0.3, 0.35),
  t('dlp 1.1', 'William Basinski', 2002, 3, 'naturalMinor', 0.15, 0.25, 0.1),
  t('By the Throat', 'Ben Frost', 2009, 0, 'naturalMinor', 0.5, 0.2, 0.4),
  t('Structures from Silence', 'Steve Roach', 1984, 9, 'major', 0.15, 0.4, 0.1),
  t('Journey in Satchidananda', 'Alice Coltrane', 1971, 6, 'dorian', 0.3, 0.5, 0.3),
  t('Astral Traveling', 'Pharoah Sanders', 1971, 5, 'dorian', 0.35, 0.55, 0.35),
  t('He Loved Him Madly', 'Miles Davis', 1974, 3, 'dorian', 0.2, 0.3, 0.2),
  t('Endless Summer', 'Fennesz', 2001, 10, 'major', 0.45, 0.6, 0.5),
  t('Dayvan Cowboy', 'Boards of Canada', 2005, 4, 'mixolydian', 0.5, 0.55, 0.5),
  t('Aquarius', 'Boards of Canada', 1998, 9, 'pentatonicMajor', 0.45, 0.6, 0.55),
  t('Steep Hills of Vicodin Tears', 'A Winged Victory for the Sullen', 2011, 1, 'naturalMinor', 0.2, 0.35, 0.15),
  t('Green', 'Hiroshi Yoshimura', 1986, 7, 'major', 0.25, 0.5, 0.25),
  t('Sing', 'Slowdive', 1993, 7, 'naturalMinor', 0.4, 0.5, 0.4),
  t('Sometimes', 'My Bloody Valentine', 1991, 4, 'naturalMinor', 0.35, 0.4, 0.3),
  t('A Walk', 'Tycho', 2011, 2, 'major', 0.5, 0.65, 0.5),
  t('Endless Falls', 'Loscil', 2010, 9, 'naturalMinor', 0.2, 0.3, 0.15),
  t('I Believe in You', 'Talk Talk', 1991, 11, 'naturalMinor', 0.3, 0.35, 0.25),
  t('A Huge Ever Growing Pulsating Brain That Rules from the Centre of the Ultraworld', 'The Orb', 1991, 4, 'naturalMinor', 0.5, 0.5, 0.6),
  t('Sundry', 'Kaitlyn Aurelia Smith', 2016, 0, 'pentatonicMajor', 0.45, 0.7, 0.5),
  t('Unspoken', 'Four Tet', 2003, 2, 'naturalMinor', 0.45, 0.55, 0.5),
  t("The Sun's Gone Dim and the Sky's Turned Black", 'Johann Johannsson', 2006, 2, 'naturalMinor', 0.3, 0.2, 0.2),
  t('In McDonalds', 'Burial', 2007, 7, 'naturalMinor', 0.25, 0.25, 0.2),
]

/** Blue Notes reference library: jazz, neo-soul, and mellow fusion recordings. */
const BLUE_NOTES_TRACKS: TrackSeed[] = [
  t('Blue in Green', 'Miles Davis', 1959, 3, 'dorian', 0.2, 0.3, 0.2),
  t('Flamenco Sketches', 'Miles Davis', 1959, 0, 'major', 0.15, 0.35, 0.15),
  t('In a Sentimental Mood', 'John Coltrane & Duke Ellington', 1962, 2, 'dorian', 0.25, 0.4, 0.25),
  t('Peace Piece', 'Bill Evans', 1958, 0, 'major', 0.15, 0.4, 0.15),
  t('Waltz for Debby', 'Bill Evans', 1961, 5, 'major', 0.35, 0.5, 0.4),
  t('My Funny Valentine', 'Chet Baker', 1954, 0, 'naturalMinor', 0.2, 0.3, 0.2),
  t("'Round Midnight", 'Thelonious Monk', 1947, 3, 'naturalMinor', 0.25, 0.25, 0.25),
  t('Maiden Voyage', 'Herbie Hancock', 1965, 2, 'dorian', 0.4, 0.5, 0.4),
  t('Cantaloupe Island', 'Herbie Hancock', 1964, 5, 'dorian', 0.55, 0.5, 0.55),
  t('Infant Eyes', 'Wayne Shorter', 1964, 3, 'major', 0.2, 0.35, 0.2),
  t('I Loves You, Porgy', 'Nina Simone', 1958, 10, 'major', 0.2, 0.35, 0.2),
  t('In a Silent Way', 'Miles Davis', 1969, 4, 'major', 0.25, 0.45, 0.3),
  t('Time Moves Slow', 'BADBADNOTGOOD', 2016, 5, 'dorian', 0.35, 0.4, 0.35),
  t('Strasbourg / St. Denis', 'Roy Hargrove', 2008, 10, 'mixolydian', 0.6, 0.55, 0.6),
  t('Poinciana', 'Ahmad Jamal', 1958, 2, 'naturalMinor', 0.45, 0.45, 0.45),
  t('Song for My Father', 'Horace Silver', 1964, 5, 'dorian', 0.5, 0.5, 0.5),
  t('Mood Indigo', 'Duke Ellington', 1930, 8, 'major', 0.2, 0.3, 0.2),
  t('Mercy, Mercy, Mercy', 'Cannonball Adderley', 1966, 10, 'mixolydian', 0.55, 0.5, 0.55),
  t('The Koln Concert, Part I', 'Keith Jarrett', 1975, 5, 'major', 0.35, 0.5, 0.4),
  t('Exit Music (For a Film)', 'Brad Mehldau', 1998, 11, 'naturalMinor', 0.35, 0.35, 0.35),
  t("Don't Know Why", 'Norah Jones', 2002, 10, 'major', 0.3, 0.4, 0.3),
  t('Take Five', 'The Dave Brubeck Quartet', 1959, 3, 'dorian', 0.52, 0.5, 0.58),
  t('Watermelon Man', 'Herbie Hancock', 1973, 5, 'dorian', 0.56, 0.48, 0.6),
  t('Naima', 'John Coltrane', 1960, 3, 'major', 0.22, 0.4, 0.22),
  t('Footprints', 'Wayne Shorter', 1966, 0, 'naturalMinor', 0.46, 0.4, 0.5),
  t('Truth', 'Kamasi Washington', 2017, 8, 'major', 0.55, 0.55, 0.6),
  t('Lingus', 'Snarky Puppy', 2014, 11, 'naturalMinor', 0.8, 0.6, 0.8),
  t("Breezin'", 'George Benson', 1976, 7, 'mixolydian', 0.55, 0.55, 0.5),
  t('Spain', 'Chick Corea', 1971, 11, 'major', 0.6, 0.6, 0.65),
  t('Hey Laura', 'Gregory Porter', 2013, 3, 'major', 0.35, 0.45, 0.35),
  t('Just the Two of Us', 'Grover Washington Jr.', 1981, 5, 'naturalMinor', 0.3, 0.4, 0.3),
  t('Evan Finds the Third Room', 'Khruangbin', 2018, 2, 'naturalMinor', 0.5, 0.45, 0.55),
]

/** After Hours reference library: downtempo and deep electronic recordings. */
const AFTER_HOURS_TRACKS: TrackSeed[] = [
  t('Teardrop', 'Massive Attack', 1998, 9, 'naturalMinor', 0.5, 0.4, 0.5),
  t('Angel', 'Massive Attack', 1998, 2, 'naturalMinor', 0.55, 0.3, 0.5),
  t('Roads', 'Portishead', 1994, 4, 'naturalMinor', 0.4, 0.35, 0.4),
  t('Archangel', 'Burial', 2007, 6, 'naturalMinor', 0.6, 0.35, 0.65),
  t('Intro', 'The xx', 2009, 2, 'naturalMinor', 0.4, 0.3, 0.4),
  t('Crystalised', 'The xx', 2009, 7, 'naturalMinor', 0.5, 0.35, 0.5),
  t('Roygbiv', 'Boards of Canada', 1998, 0, 'major', 0.5, 0.55, 0.55),
  t('Parallel Jalebi', 'Four Tet', 2013, 9, 'naturalMinor', 0.55, 0.45, 0.6),
  t('Two Thousand and Seventeen', 'Four Tet', 2017, 6, 'dorian', 0.5, 0.5, 0.55),
  t("Can't Do Without You", 'Caribou', 2014, 0, 'major', 0.6, 0.55, 0.65),
  t('Kiara', 'Bonobo', 2010, 4, 'naturalMinor', 0.6, 0.4, 0.6),
  t('Cirrus', 'Bonobo', 2013, 9, 'dorian', 0.55, 0.5, 0.55),
  t('Xtal', 'Aphex Twin', 1992, 11, 'naturalMinor', 0.55, 0.5, 0.55),
  t('Over the Ice', 'The Field', 2007, 9, 'naturalMinor', 0.65, 0.4, 0.7),
  t('Nespole', 'Floating Points', 2015, 5, 'dorian', 0.5, 0.45, 0.5),
  t('Sleep Sound', 'Jamie xx', 2014, 7, 'naturalMinor', 0.5, 0.4, 0.5),
  t('Space Is Only Noise If You Can See', 'Nicolas Jaar', 2011, 4, 'dorian', 0.45, 0.35, 0.5),
  t('Golden Arrow', 'Darkside', 2013, 9, 'naturalMinor', 0.5, 0.4, 0.5),
  t('Moan', 'Trentemoller', 2006, 2, 'naturalMinor', 0.6, 0.35, 0.6),
  t('A New Error', 'Moderat', 2009, 0, 'naturalMinor', 0.55, 0.3, 0.55),
  t('Goodbye', 'Apparat', 2007, 2, 'naturalMinor', 0.5, 0.35, 0.5),
  t('Looped', 'Kiasmos', 2014, 9, 'naturalMinor', 0.6, 0.4, 0.65),
  t('Open Eye Signal', 'Jon Hopkins', 2013, 9, 'pentatonicMinor', 0.7, 0.5, 0.7),
  t('Says', 'Nils Frahm', 2013, 6, 'naturalMinor', 0.65, 0.45, 0.7),
  t('Glue', 'Bicep', 2017, 10, 'naturalMinor', 0.65, 0.4, 0.7),
  t('Rose Rouge', 'St. Germain', 2000, 7, 'dorian', 0.6, 0.5, 0.65),
  t('Les Nuits', 'Nightmares on Wax', 1999, 0, 'dorian', 0.5, 0.45, 0.5),
  t('High Noon', 'Kruder & Dorfmeister', 1998, 2, 'naturalMinor', 0.55, 0.35, 0.55),
  t('Lebanese Blonde', 'Thievery Corporation', 1998, 9, 'dorian', 0.45, 0.5, 0.5),
  t('Someone Great', 'LCD Soundsystem', 2007, 4, 'mixolydian', 0.6, 0.55, 0.6),
  t('Awake', 'Tycho', 2014, 7, 'major', 0.55, 0.55, 0.55),
  t('Eple', 'Royksopp', 1999, 5, 'major', 0.6, 0.55, 0.6),
]

/** Reference library per station. */
export const TRACK_CATALOGS: Record<StationId, readonly TrackSeed[]> = {
  weightless: WEIGHTLESS_TRACKS,
  'hip-hop': LOW_END_TRACKS,
  'blue-notes': BLUE_NOTES_TRACKS,
  'neo-soul': VELVET_TRACKS,
  vaporwave: VAPORWAVE_TRACKS,
  indie: INDIE_TRACKS,
  'after-hours': AFTER_HOURS_TRACKS,
}
