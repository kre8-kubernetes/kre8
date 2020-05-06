import React, { Component } from 'react';

class OutsideClick extends Component {
  constructor(props) {
    super(props);
    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  /**
   * Set the wrapper ref
   */
  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  /**
   * Alert if clicked on outside of element
   */
  handleClickOutside(event) {
    const { handleOutsideClick } = this.props;
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      handleOutsideClick(event);
      console.log('++++++++++++++++++++');
      console.log('You clicked outside!');
    }
  }

  render() {
    const { className, children } = this.props;
    console.log('PROPS!!!', this.props);
    return (
      <div className={className} ref={this.setWrapperRef}>{children}</div>
    );
  }
}

export default OutsideClick