import React, { Component } from "react";
import { NavLink, Redirect } from "react-router-dom";

import icons from "./../../components-img/icons.svg";
import { ReleaseMetadata, TrackMetadata } from "../../types";
import { toHoursMinSec, toBitrate } from "../../utils/utils";
import { Btn } from "./../btn/btn";

import "./release-details-modal.scss";

const { REACT_APP_API_ROOT } = process.env;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  showModal: boolean;
  releaseId: number;
  onModalClose: () => void;
  handleDeleteReleaseBtnClick: (releaseId: number) => void;
}
interface State {
  open: boolean;
  releaseMetadata: ReleaseMetadata | null;
  tracksMetadataCollection: TrackMetadata[] | null;
  error: string | null;
}

class ReleaseDetailsModal extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      open: false,
      releaseMetadata: null,
      tracksMetadataCollection: null,
      error: null,
    };

    this.handleClose = this.handleClose.bind(this);
    this.handleDeleteBtnClick = this.handleDeleteBtnClick.bind(this);
  }

  getReleaseMetadata() {
    const { releaseId } = this.props;
    const apiUrl = `${REACT_APP_API_ROOT}/releases/${releaseId}`;

    fetch(apiUrl)
      .then((res) => res.json())
      .then((res) => {
        if (res.hasOwnProperty("errorCode")) {
          throw new Error(`${apiUrl}: ${res.message}`);
        } else {
          return res;
        }
      })
      .then((res) => {
        this.setState({ releaseMetadata: res });
      });
  }

  handleClose() {
    document.body.style.overflow = "unset";
    this.props.onModalClose();
  }

  getTracksMetadata() {
    const { releaseId } = this.props;
    const apiUrl = `${REACT_APP_API_ROOT}/releases/${releaseId}/tracks`;

    fetch(apiUrl)
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
        if (res.hasOwnProperty("errorCode")) {
          throw new Error(`${apiUrl}: ${res.message}`);
        } else {
          return res;
        }
      })
      .then((res) => {
        console.dir(res);
        this.setState({ tracksMetadataCollection: res.results });
      });
  }

  handleDeleteBtnClick(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    e.preventDefault();
    this.props.handleDeleteReleaseBtnClick(this.props.releaseId);
    this.handleClose();
  }

  componentDidMount() {
    if (this.state.open) document.body.style.overflow = "hidden";

    this.getReleaseMetadata();
    this.getTracksMetadata();
  }

  componentWillUnmount() {
    this.setState({ open: false, error: null });
  }

  render() {
    if (!this.props.showModal) return null;

    const showHideClassName = this.props.showModal
      ? "release-details-modal release-details-modal_active"
      : "release-details-modal";

    if (this.state.releaseMetadata && this.state.tracksMetadataCollection) {
      const tracksJSX = this.state.tracksMetadataCollection?.map(
        (trackMetadata) => {
          const {
            trackNo,
            artist,
            title,
            genre,
            duration,
            bitrate,
            extension,
            filePath,
          } = trackMetadata;

          return (
            <div
              className="release-details-modal__track"
              key={trackMetadata.trackId}
            >
              <span className="release-details-modal__track-no">{trackNo}</span>
              <span className="release-details-modal__artist">
                {artist.join(", ")}
              </span>
              <span className="release-details-modal__track-title">
                {title}
              </span>
              <span className="release-details-modal__genres">
                {genre.join(", ")}
              </span>
              <span className="release-details-modal__bitrate">
                {bitrate ? toBitrate(bitrate) : "—"}
              </span>
              <span className="release-details-modal__extension">
                {extension || "—"}
              </span>
              <span className="release-details-modal__duration">
                {toHoursMinSec(duration)}
              </span>
            </div>
          );
        }
      );

      const {
        year,
        artist,
        title,
        label,
        catNo,
        coverPath,
      } = this.state.releaseMetadata;

      return (
        <div className={showHideClassName}>
          <section className="release-details-modal__container">
            <header className="release-details-modal__header">
              <span className="release-details-modal__heading">
                Release Details
              </span>
              <span
                className="release-details-modal__close-btn"
                onClick={this.handleClose}
              >
                &#10006;
              </span>
            </header>
            <hr className="release-details-modal__hr" />
            <main className="release-details-modal__content">
              <img src={coverPath} className="release-details-modal__cover" />

              <ul className="release-details-modal__details">
                <li className="release-details-modal__title">
                  {artist} - {title}
                </li>
                <li>
                  <strong>Year: </strong>
                  <span>{year}</span>
                </li>
                <li>
                  <strong>Label: </strong>
                  <span>
                    {label} — {catNo}
                  </span>
                </li>
              </ul>
              <div className="release-details-modal__tracklist">
                {tracksJSX}
              </div>
            </main>
            <nav className="release-details-modal__nav">
              <Btn
                href={"/release/edit"}
                text="Edit"
                className="release-details-modal__edit-btn btn btn_theme_empty"
              />
              <NavLink
                to="/"
                className="release-details-modal__edit-btn btn btn_theme_empty"
                onClick={this.handleDeleteBtnClick}
              >
                Delete
              </NavLink>
            </nav>
            {!this.state.error ? (
              ""
            ) : (
              <span className="release-details-modal__msg release-details-modal__msg_warning">
                {this.state.error}
              </span>
            )}
          </section>
        </div>
      );
    } else return null;
  }
}

export { ReleaseDetailsModal };
