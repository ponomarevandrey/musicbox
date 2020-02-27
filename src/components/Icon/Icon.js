import React, { Component } from "react";
import PropTypes from "prop-types";

import icons from "./../../img/icons.svg";

class Icon extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <svg className={`${this.props.className}`}>
        <use href={`${icons}#${this.props.nameInSprite}`} />
      </svg>
    );
  }

  /*
  static defaultProps = {
    height: "1.4em"
  };
  */
  static propTypes = {
    nameInSprite: PropTypes.string,
    className: PropTypes.string
  };
}

export default Icon;
