import * as types from "../../types";

export class Track {
  private _trackId?: types.TrackId;
  private _releaseId?: types.ReleaseId;
  private _filePath: types.FilePath;
  private _extension: types.Extension;
  private _trackArtist: types.TrackArtist;
  private _releaseArtist: types.ReleaseArtist;
  private _duration: types.Duration;
  private _bitrate: types.Bitrate;
  private _year: types.Year;
  private _trackNo: types.TrackNo;
  private _trackTitle: types.TrackTitle;
  private _releaseTitle: types.ReleaseTitle;
  private _diskNo: types.DiskNo;
  private _label: types.Label;
  private _genre: types.Genre;
  private _coverPath: types.CoverPath;
  private _catNo: types.CatNo;

  constructor(metadata: types.TrackMetadata) {
    if (metadata.trackId) this._trackId = metadata.trackId;
    if (metadata.releaseId) this._releaseId = metadata.releaseId;
    this._filePath = metadata.filePath;
    this._extension = metadata.extension;
    this._trackArtist = metadata.trackArtist;
    this._releaseArtist = metadata.releaseArtist;
    this._duration = metadata.duration;
    this._bitrate = metadata.bitrate;
    this._year = metadata.year;
    this._trackNo = metadata.trackNo;
    this._trackTitle = metadata.trackTitle;
    this._releaseTitle = metadata.releaseTitle;
    this._diskNo = metadata.diskNo;
    this._label = metadata.label;
    this._genre = metadata.genre;
    this._coverPath = metadata.coverPath;
    this._catNo = metadata.catNo;
  }

  setTrackId(newId: types.TrackId) {
    if (typeof newId === "number") {
      this._trackId = newId;
    } else {
      throw new Error("Can't set trackId: argument must be a number");
    }
  }

  getTrackId(): types.TrackId | void {
    if (this._trackId) return this._trackId;
  }

  getReleaseId(): types.ReleaseId | void {
    if (this._releaseId) return this._releaseId;
  }

  get filePath(): types.FilePath {
    return this._filePath;
  }

  get extension(): types.Extension {
    return this._extension;
  }

  get trackArtist(): types.TrackArtist {
    return this._trackArtist;
  }

  get releaseArtist(): types.ReleaseArtist {
    return this._releaseArtist;
  }

  get duration(): types.Duration {
    return this._duration;
  }

  get bitrate(): types.Bitrate {
    return this._bitrate;
  }

  get year(): types.Year {
    return this._year;
  }

  get trackNo(): types.TrackNo {
    return this._trackNo;
  }

  get trackTitle(): types.TrackTitle {
    return this._trackTitle;
  }

  get releaseTitle(): types.ReleaseTitle {
    return this._releaseTitle;
  }

  get diskNo(): types.DiskNo {
    return this._diskNo;
  }

  get label(): types.Label {
    return this._label;
  }

  get genre(): types.Genre {
    return this._genre;
  }

  get coverPath(): types.CoverPath {
    return this._coverPath;
  }

  get catNo(): types.CatNo {
    return this._catNo;
  }

  get JSON() {
    const track = {
      filePath: this.filePath,
      extension: this.extension,
      trackArtist: this.trackArtist,
      releaseArtist: this.releaseArtist,
      duration: this.duration,
      bitrate: this.bitrate,
      year: this.year,
      trackNo: this.trackNo,
      trackTitle: this.trackTitle,
      releaseTitle: this.releaseTitle,
      diskNo: this.diskNo,
      label: this.label,
      genre: this.genre,
      coverPath: this.coverPath,
      catNo: this.catNo,
    };

    const trackId = this.getTrackId();
    const releaseId = this.getReleaseId();
    if (trackId) Object.assign(track, { trackId });
    if (releaseId) Object.assign(track, { releaseId });

    return track;
  }
  /*
  static fromJSON(json: string): Track {
    const data = JSON.parse(json);
    const track = new Track(data);
    return track;
  }
  */
}