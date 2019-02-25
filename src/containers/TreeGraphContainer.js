import React, { Component } from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Group } from '@vx/group';
import { Tree } from '@vx/hierarchy';
import { LinkHorizontal } from '@vx/shape';
import { hierarchy } from 'd3-hierarchy';
import { LinearGradient } from '@vx/gradient';

import TreeGraphComponent from '../components/TreeGraphComponent';

class TreeGraphContainer extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const treeData = {
      "name": "T",
      "children": [{
        "name": "A",
        "children": [
          { "name": "A1" },
          { "name": "A2" },
          { "name": "A3" },
          {
            "name": "C",
            "children": [{
              "name": "C1",
            }, {
              "name": "D",
              "children": [{
                "name": "D1"
              }, {
                "name": "D2"
              }, {
                "name": "D3"
              }]
            }]
          },
        ]
      },
      { "name": "Z" },
      {
        "name": "B",
        "children": [
          { "name": "B1" },
          { "name": "B2" },
          { "name": "B3" },
        ]
      },
      ],
    };

    const margin = {
      top: 10,
      left: 30,
      right: 40,
      bottom: 80
    };

    return (
      <div className='treegraph_container'>
        <TreeGraphComponent
          width={900}
          height={600}
          treeData={treeData}
          margin={margin}
        />
      </div>
    )
  }
}

export default withRouter(connect(null, null)(TreeGraphContainer));
