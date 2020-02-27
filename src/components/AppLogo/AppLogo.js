import React, { Component } from "react";
import PropTypes from "prop-types";

function AppLogo(props) {
  const { className, fill, height } = props;
  const SVGpath =
    "M28.512 0c-.958 0-1.776.69-1.776 1.578 0 .887.818 1.578 1.776 1.578.957 0 1.775-.69 1.775-1.578C30.287.691 29.47 0 28.512 0zm-6.319.197v4.155c-.267-.296-.902-.9-2.113-.9-1.465 0-3.111 1.154-3.111 3.689 0 2.253 1.365 3.705 3.111 3.705.634 0 1.507-.198 2.211-1v.703h3.057V.197h-3.155zm9.473 0V10.55h3.057v-.703c.366.436 1.028 1 2.21 1 1.578 0 3.112-1.34 3.112-3.705 0-2.521-1.647-3.69-3.111-3.69-1.198 0-1.846.605-2.114.9V.198h-3.154zM1.932.887v.865h7.642V.887H1.932zm-.75 1.547V3.3h9.263v-.867H1.182zm43.83 1.017c-2.888 0-4.112 1.76-4.112 3.69 0 1.943 1.239 3.705 4.112 3.705s4.113-1.762 4.113-3.705c0-1.93-1.226-3.69-4.113-3.69zm-18.078.295v9.565h3.156V3.746h-3.156zm22.818 0l2.465 3.197-2.76 3.606h3.252l1.184-1.93 1.183 1.93h3.254l-2.762-3.606 2.465-3.197h-3.351l-.79 1.621-.788-1.62h-3.352zM.568 4.004v.96h10.487v-.96H.568zM0 5.674v5.162h11.627V5.674H0zm21.22.142c.719 0 1.17.536 1.17 1.325 0 .816-.465 1.338-1.17 1.338-.703 0-1.197-.522-1.197-1.338 0-.79.494-1.325 1.198-1.325zm14.587 0c.69 0 1.183.536 1.183 1.325 0 .816-.493 1.338-1.183 1.338-.69 0-1.184-.522-1.184-1.338 0-.79.494-1.325 1.184-1.325zm9.205.198c.817 0 1.056.704 1.056 1.127 0 .436-.24 1.14-1.056 1.14-.817 0-1.057-.704-1.057-1.14 0-.423.24-1.127 1.057-1.127z";

  return (
    <svg
      role="img"
      aria-label="Logo"
      viewBox="0 0 58.325 13.308"
      className={className}
      height={height}
    >
      <title>MusicBox Logo</title>
      <path d={SVGpath} fill={fill} />
    </svg>
  );
}

AppLogo.propTypes = {
  height: PropTypes.string,
  fill: PropTypes.string,
  className: PropTypes.string
};

export default AppLogo;