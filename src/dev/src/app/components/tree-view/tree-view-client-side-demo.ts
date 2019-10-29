import { Component, ViewChild, TemplateRef } from '@angular/core';
import {
  BasicTreeNode,
  ServerSideTreeNode,
  PagingParams,
  PagedTreeNode,
  TreeNodeDataRetriever,
  TreeNode,
  TreeNodeData,
  PagedTreeNodeDataRetriever,
} from '@ferui/components';

@Component({
  template: `
    <h1>Client Side Tree View</h1>
    <fui-tree-view
      (onNodeEvent)="onEvent($event)"
      [treeNodeData]="treeNodeData"
      [dataRetriever]="treeDataRetriever"
      [config]="{ width: '250px', height: '300px', colorVariation: 'LIGHT_BLUE' }"
    ></fui-tree-view>

    <!--<h1>Client Side Tree View Array Type</h1>-->
    <!--<fui-tree-view-->
    <!--(onNodeEvent)="onEvent($event)"-->
    <!--[treeNodeData]="treeNodeDataArray"-->
    <!--[dataRetriever]="treeDataArrayRetriever"-->
    <!--[config]="{ width: '250px', height: '300px', colorVariation: 'DARK_BLUE' }"-->
    <!--&gt;</fui-tree-view>-->

    <h1>Server Side Tree View</h1>
    <fui-tree-view
      (onNodeEvent)="onEvent($event)"
      [treeNodeData]="serverSideTreeNodeData"
      [dataRetriever]="serverDataRetriever"
      [config]="{ width: '250px', height: '300px', colorVariation: 'DARK_BLUE' }"
    ></fui-tree-view>

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
    childrenLabel: 'children',
  };

  serverSideTreeNodeData: TreeNodeData<FoodNode> = {
    data: { name: 'Foods' },
    label: 'name',
    childrenLabel: 'children',
  };

  treeNodeDataArray = {
    data: TREE_DATA_ARRAY,
    label: 'name',
    childrenLabel: 'children',
  };

  treeDataArrayRetriever = {
    hasChildNodes: (node: TreeNode<FoodNode>) => {
      return Promise.resolve(!!node.getData().data.children && node.getData().data.children.length > 0);
    },
    getChildNodeData: (node: TreeNode<FoodNode>) => {
      return Promise.resolve(
        node.getData().data.children.map(it => {
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
      return Promise.resolve(!!node.getData().data.children && node.getData().data.children.length > 0);
    },
    getChildNodeData: (node: TreeNode<FoodNode>) => {
      return Promise.resolve(
        node.getData().data.children.map(it => {
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
      const obj = this.flattenAllData(TREE_DATA, 'name', 'children', 0).find(it => it.name === node.getData().data.name);
      return Promise.resolve(!!obj.children && obj.children.length > 0);
    },
    getChildNodeData: (node: TreeNode<FoodNode>) => {
      return Promise.resolve(
        node.getData().data.children.map(it => {
          return { data: it, label: 'name' };
        })
      );
    },
    getIconTemplate: (node: TreeNode<FoodNode>, isExpanded: boolean, isSelected: boolean) => {
      return isExpanded ? this.expandedTem : this.nonExpandedTem;
    },
    getPagedChildNodeData: (node: PagedTreeNode<FoodNode>, pagingParams: PagingParams) => {
      return new Promise((resolve, reject) => {
        // Will mock an error if data label is Orange
        if (node.getData().data.name === 'Orange') {
          setTimeout(() => reject(), 1000);
        } else {
          setTimeout(() => {
            const obj = this.flattenAllData(TREE_DATA, 'name', 'children', 0).find(
              it => it.name === node.getData().data.name
            );
            const children = obj.children.slice(pagingParams.offset, pagingParams.offset + pagingParams.limit);
            resolve(
              children.map(it => {
                return { data: { name: it.name }, label: 'name' };
              })
            );
          }, 1000);
        }
      });
    },
    getNumberOfChildNodes: (node: PagedTreeNode<FoodNode>) => {
      const obj = this.flattenAllData(TREE_DATA, 'name', 'children', 0).find(it => it.name === node.getData().data.name);
      return Promise.resolve(obj.children.length);
    },
  } as PagedTreeNodeDataRetriever<FoodNode>;

  ngOnInit() {
    for (let i = 0; i <= 50; i++) {
      TREE_DATA.children[0].children.push({ name: 'Fruit Child ' + i });
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
        //{ name: 'Orange' },
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
      // { name: 'Orange' },
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
];
