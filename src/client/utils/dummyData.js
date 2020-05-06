import uuid from 'uuid';

export default {
  name: 'Master Node',
  id: uuid(),
  type: 'apiserver',
  children: [
    {
      name: 'Worker Node #1',
      id: uuid(),
      worder_node_id: 0,
      type: 'Node',
      children: [
        {
          name: '#1',
          id: uuid(),
          pod_id: 0,
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#2',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
      ]
    },
    {
      name: 'Worker Node #2',
      id: uuid(),
      worder_node_id: 1,
      type: 'Node',
      children: [
        {
          name: '#1',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#2',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
      ],
    },
    {
      name: 'Worker Node #3',
      id: uuid(),
      worder_node_id: 2,
      type: 'Node',
      children: [
        {
          name: '#1',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#2',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
      ],
    },
    {
      name: 'Worker Node #4',
      id: uuid(),
      worder_node_id: 3,
      type: 'Node',
      children: [
        {
          name: '#1',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#2',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
        {
          name: '#3',
          id: uuid(),
          type: 'Pod',
          children: [{
            name: '',
            id: uuid(),
            type: 'Container',
          }],
        },
      ],
    },
    {
      name: 'kube-apiserver',
      id: uuid(),
      type: 'master-component',
    },
    {
      name: 'etcd',
      id: uuid(),
      type: 'master-component',
    },
    {
      name: 'kube-scheduler',
      id: uuid(),
      type: 'master - component',
    },
    {
      name: 'kube-controller-manager',
      type: 'master - component',
    },
  ],
};