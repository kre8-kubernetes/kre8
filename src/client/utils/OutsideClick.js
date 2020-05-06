/* eslint-disable no-undef */
import React, { Component } from 'react';

// While this component wrapper is mounted on the page, the
// handleClick method will be called on mousedown. If the click
// happened at or above on the dom tree, then the passed in
// handleOutsideClick prop function will be invoked. Passing in the
// prop of className can help set the height/width of children.
class OutsideClick extends Component {
  constructor(props) {
    super(props);
    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickEvent = this.handleClickEvent.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickEvent);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickEvent);
  }

  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  handleClickEvent(event) {
    const { handleOutsideClick } = this.props;
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      handleOutsideClick(event);
    }
  }

  render() {
    const { className, children } = this.props;
    return (
      <div className={className} ref={this.setWrapperRef}>{children}</div>
    );
  }
}

export default OutsideClick;
