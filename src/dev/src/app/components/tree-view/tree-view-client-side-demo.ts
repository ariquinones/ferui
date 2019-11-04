import { Component, ViewChild, TemplateRef } from '@angular/core';
import {
  PagingParams,
  TreeNodeDataRetriever,
  TreeNode,
  TreeNodeData,
  PagedTreeNodeDataRetriever,
  NonRootTreeNode,
} from '@ferui/components';

@Component({
  template: `
    <div>
      <h1>Client Side Tree View</h1>
      <fui-tree-view
        (onNodeEvent)="onEvent($event)"
        [treeNodeData]="treeNodeData"
        [dataRetriever]="treeDataRetriever"
        [config]="{ width: '250px', height: '300px', colorVariation: 'LIGHT_BLUE' }"
      ></fui-tree-view>
    </div>
    <div>
      <h1>Client Side Tree View Array Type</h1>
      <fui-tree-view
        (onNodeEvent)="onEvent($event)"
        [treeNodeData]="noRoot"
        [dataRetriever]="treeDataArrayRetriever"
        [config]="{ width: '250px', height: '300px' }"
      ></fui-tree-view>
    </div>
    <div>
      <h1>Server Side Tree View</h1>
      <fui-tree-view
        (onNodeEvent)="onEvent($event)"
        [treeNodeData]="serverSideTreeNodeData"
        [dataRetriever]="serverDataRetriever"
        [config]="{ width: '250px', height: '300px', colorVariation: 'DARK_BLUE' }"
      ></fui-tree-view>
    </div>

    <ng-template #expandedFolder>
      <clr-icon class="fui-less-icon" shape="fui-less"></clr-icon>
    </ng-template>
    <ng-template #nonExpandedFolder>
      <clr-icon class="fui-add-icon" shape="fui-add"></clr-icon>
    </ng-template>
  `,
  styles: [
    `
      .fui-less-icon {
        height: 12px;
        width: 10px;
        margin-bottom: 2px;
      }
      .fui-add-icon {
        height: 12px;
        width: 12px;
        margin-bottom: 2px;
      }
    `,
  ],
})
export class TreeViewClientSideDemo {
  @ViewChild('expandedFolder') expandedTem: TemplateRef<any>;
  @ViewChild('nonExpandedFolder') nonExpandedTem: TemplateRef<any>;

  treeNodeData: TreeNodeData<FoodNode> = {
    data: TREE_DATA,
    label: 'name',
  };

  serverSideTreeNodeData: TreeNodeData<FoodNode> = {
    data: { name: 'Foods' },
    label: 'name',
  };

  noRoot = new NonRootTreeNode();

  treeDataArrayRetriever = {
    hasChildNodes: (node: TreeNode<FoodNode>) => {
      return Promise.resolve(!!node.data.data.children && node.data.data.children.length > 0);
    },
    getChildNodeData: (node: TreeNode<FoodNode>) => {
      const isEmptyRoot = node.data instanceof NonRootTreeNode;
      if (isEmptyRoot) {
        return Promise.resolve(
          TREE_DATA_ARRAY.map(it => {
            return { data: it, label: 'name' };
          })
        );
      }
      return Promise.resolve(
        node.data.data.children.map(it => {
          return { data: it, label: 'name' };
        })
      );
    },
    getIconTemplate: (node: TreeNode<FoodNode>, isExpanded: boolean, isSelected: boolean) => {
      return isExpanded ? this.expandedTem : this.nonExpandedTem;
    },
  };

  treeDataRetriever = {
    hasChildNodes: (node: TreeNode<FoodNode>) => {
      return Promise.resolve(!!node.data.data.children && node.data.data.children.length > 0);
    },
    getChildNodeData: (node: TreeNode<FoodNode>) => {
      return Promise.resolve(
        node.data.data.children.map(it => {
          return { data: it, label: 'name' };
        })
      );
    },
    getIconTemplate: (node: TreeNode<FoodNode>, isExpanded: boolean, isSelected: boolean) => {
      return isExpanded ? this.expandedTem : this.nonExpandedTem;
    },
  } as TreeNodeDataRetriever<FoodNode>;

  // Server side node
  serverDataRetriever = {
    hasChildNodes: (node: TreeNode<FoodNode>) => {
      const obj = this.flattenAllData(TREE_DATA, 'name', 'children', 0).find(it => it.name === node.data.data['name']);
      return Promise.resolve(!!obj.children && obj.children.length > 0);
    },
    getChildNodeData: (node: TreeNode<FoodNode>) => {
      return Promise.resolve(
        node.data.data['children'].map(i => {
          return { data: it, label: 'name' };
        })
      );
    },
    getIconTemplate: (node: TreeNode<FoodNode>, isExpanded: boolean, isSelected: boolean) => {
      return isExpanded ? this.expandedTem : this.nonExpandedTem;
    },
    getPagedChildNodeData: (node: TreeNode<FoodNode>, pagingParams: PagingParams) => {
      return new Promise((resolve, reject) => {
        // Will mock an error if data label is Orange
        if (node.data.data['name'] === 'Orange') {
          setTimeout(() => reject(), 1000);
        } else {
          setTimeout(() => {
            const obj = this.flattenAllData(TREE_DATA, 'name', 'children', 0).find(
              it => it.name === node.data.data['name']
            );
            const children = obj.children.slice(pagingParams.offset, pagingParams.offset + pagingParams.limit);
            resolve(
              children.map(it => {
                return { data: { name: it.name }, label: 'name' };
              })
            );
          }, 500);
        }
      });
    },
  } as PagedTreeNodeDataRetriever<FoodNode>;

  ngOnInit() {
    for (let i = 0; i <= 25; i++) {
      TREE_DATA.children[0].children.push({ name: 'Fruit Child ' + i });
    }
    for (let x = 0; x <= 20; x++) {
      TREE_DATA.children[1].children.push({ name: 'Vegetable Child ' + x });
      TREE_DATA.children[0].children[3].children.push({ name: 'Strawberry child ' + x });
    }
  }

  onEvent(event) {
    // console.log('A node event has been emitted for the outside world to see', event);
  }

  // FOR TESTING PURPOSES WE FLATTEN THE TREE_DATA OBJECT
  flattenAllData(originalObj: any, label: string, childrenLabel: string, level: number) {
    let concatenatedArray = [];
    const startingLevel = level ? level : 0;
    if (this.isPlainObject(originalObj)) {
      if (Object.keys(originalObj).find(val => val === label)) {
        concatenatedArray.push(
          Object.assign({}, originalObj, { fui_label: originalObj[label], fui_level: startingLevel, fui_parent: parent })
        );
        if (Object.keys(originalObj).find(val => val === childrenLabel)) {
          // this means the object has a childrens array within it
          if (originalObj[childrenLabel].length > 0) {
            originalObj[childrenLabel].forEach(childObj => {
              const newArr = this.flattenAllData(childObj, label, childrenLabel, startingLevel + 1);
              concatenatedArray = concatenatedArray.concat(newArr);
            });
          }
        }
      }
    }
    return concatenatedArray;
  }

  private isPlainObject(value: any): boolean {
    return value && typeof value === 'object' && value.constructor === Object;
  }
}

interface FoodNode {
  name: string;
  children?: FoodNode[];
}

const TREE_DATA: FoodNode = {
  name: 'Foods',
  children: [
    {
      name: 'Fruit',
      children: [
        { name: 'Apple' },
        { name: 'Banana' },
        { name: 'Fruit loops' },
        {
          name: 'Strawberry',
          children: [],
        },
        { name: 'Blackberry' },
        { name: 'Blueberries' },
        { name: 'Kiwi' },
        { name: 'Coconut' },
      ],
    },
    {
      name: 'Vegetables',
      children: [
        {
          name: 'Green',
          children: [{ name: 'Broccoli' }, { name: 'Brussel sprouts' }],
        },
        {
          name: 'Orange',
          children: [{ name: 'Pumpkins' }, { name: 'Carrots' }],
        },
      ],
    },
  ],
};

const TREE_DATA_ARRAY = [
  {
    name: 'Fruit',
    children: [
      { name: 'Apple' },
      { name: 'Banana' },
      { name: 'Fruit loops' },
      {
        name: 'Strawberry',
        children: [
          { name: 'straberry child 1' },
          { name: 'straberry child 2' },
          { name: 'straberry child 3' },
          { name: 'straberry child 4' },
          { name: 'straberry child 5' },
          { name: 'straberry child 6' },
          { name: 'straberry child 7' },
          { name: 'straberry child 8' },
        ],
      },
      {
        name: 'Blackberry',
        children: [{ name: 'Blackberry child 1' }, { name: 'Blackberry child 2' }, { name: 'Blackberry child 3' }],
      },
      { name: 'Blueberries' },
      { name: 'Kiwi' },
      { name: 'Coconut' },
    ],
  },
  {
    name: 'Vegetables',
    children: [
      {
        name: 'Green',
        children: [{ name: 'Broccoli' }, { name: 'Brussel sprouts' }],
      },
      {
        name: 'Orange',
        children: [{ name: 'Pumpkins' }, { name: 'Carrots' }],
      },
    ],
  },
];
