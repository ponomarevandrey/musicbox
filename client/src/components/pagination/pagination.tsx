import React, { useState, useEffect } from "react";

import { Arrow } from "../arrow/arrow";
import "./pagination.scss";

interface Props {
  limit: number; // items per page
  totalItems: number;
  countPageItemsFrom: number;

  buttons: { prev: boolean; next: boolean };

  handleNextPageBtnClick: () => void;
  handlePrevPageBtnClick: () => void;

  className?: string;
}

export function Pagination(props: Props): JSX.Element | null {
  const { limit, totalItems, className = "" } = props;
  let { countPageItemsFrom } = props;

  function handlePrevBtnClick() {
    props.handlePrevPageBtnClick();
  }

  function handleNextBtnClick() {
    props.handleNextPageBtnClick();
  }

  if (totalItems === 0) countPageItemsFrom = 0;

  const to =
    countPageItemsFrom +
    (totalItems - countPageItemsFrom >= limit
      ? limit - 1
      : totalItems - countPageItemsFrom);

  const prevBtn = (
    <button
      disabled={!props.buttons.prev}
      type="button"
      className={`pagination__btn ${
        props.buttons.prev ? "" : "pagination__btn_disabled"
      }`}
      onClick={handlePrevBtnClick}
    >
      Prev
    </button>
  );

  const nextBtn = (
    <button
      disabled={!props.buttons.next}
      type="button"
      className={`pagination__btn ${
        props.buttons.next ? "" : "pagination__btn_disabled"
      }`}
      onClick={handleNextBtnClick}
    >
      Next
    </button>
  );

  return (
    <div className={`pagination ${className}`}>
      <div className="pagination__current-page">
        {countPageItemsFrom} - {to} of {totalItems}
      </div>
      <div className="pagination__btns">
        {prevBtn} {nextBtn}
      </div>
    </div>
  );
}
