import { Component, ViewChild, TemplateRef } from '@angular/core';
import {
  BasicTreeNode,
  ServerSideTreeNode,
  PagingParams,
  PagedTreeNode,
  TreeNodeDataRetriever,
  TreeNode,
} from '@ferui/components';

@Component({
  template: `
    <h1>Client Side Tree View</h1>
    <fui-tree-view
      (onNodeEvent)="onEvent($event)"
      [rootNode]="rootNode"
      [config]="{ width: '250px', height: '300px' }"
    ></fui-tree-view>

    <h1>Server Side Tree View</h1>
    <fui-tree-view [rootNode]="serverNode" [config]="{ width: '250px', colorVariation: 'LIGHT_BLUE' }"></fui-tree-view>

    <ng-template #expandedFolder>
      <span> - </span>
    </ng-template>
    <ng-template #nonExpandedFolder>
      <span> + </span>
    </ng-template>
  `,
})
export class TreeViewClientSideDemo {
  @ViewChild('expandedFolder') expandedTem: TemplateRef<any>;
  @ViewChild('nonExpandedFolder') nonExpandedTem: TemplateRef<any>;

  rootNode: BasicTreeNode<FoodNode> = new BasicTreeNode(
    { data: TREE_DATA, label: 'name' },
    {
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
    } as TreeNodeDataRetriever<FoodNode>,
    null
  );

  // Server side node
  serverNode: ServerSideTreeNode<FoodNode> = new ServerSideTreeNode(
    { data: TREE_DATA, label: 'name', limit: 3 },
    {
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
      getPagedChildNodeData: (node: PagedTreeNode<FoodNode>, pagingParams: PagingParams) => {
        return new Promise((resolve, reject) => {
          // Will mock an error if data label is Orange
          if (node.getData().data.name === 'Orange') {
            reject();
          } else {
            setTimeout(() => {
              const children = node
                .getData()
                .data.children.slice(pagingParams.offset, pagingParams.offset + pagingParams.limit);
              resolve(
                children.map(it => {
                  return { data: it, label: 'name', limit: 3 };
                })
              );
            }, 3000);
          }
        });
      },
      getNumberOfChildNodes: (node: PagedTreeNode<FoodNode>) => {
        return Promise.resolve(node.getData().data.children.length);
      },
    },
    null
  );

  onEvent(event) {
    console.log('A node event has been emitted for the outside world to see', event);
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
        { name: 'Orange' },
        { name: 'Strawberry' },
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
