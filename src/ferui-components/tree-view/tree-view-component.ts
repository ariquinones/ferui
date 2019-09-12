import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { BasicTreeNode } from './basic-tree-node';
import { TreeViewEvent, TreeViewEventType } from './interfaces';

@Component({
  selector: 'fui-tree-view',
  template: `
    <h1>Hello Tree View Component</h1>
    <fui-tree-node [node]="rootNode" (onNodeEvent)="nodeEvent($event)"></fui-tree-node>
  `,
})
export class FuiTreeViewComponent {
  @Input() rootNode: BasicTreeNode<any>; // OR could take in an array of BasicTreeNodes? In case there is no root?

  @Input() config: any;

  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>>;

  constructor() {
    this.onNodeEvent = new EventEmitter<TreeViewEvent<any>>();
  }

  nodeEvent(event: TreeViewEvent<any>): void {
    console.log(event);
    this.onNodeEvent.emit(event);
  }
}

@Component({
  selector: 'fui-tree-node',
  template: `
    <div [style.padding-left.px]="level * 10">
      <span *ngIf="hasChildren" (click)="expand()"> x </span>
      <span> {{ node.getData().data[node.getLabel()] }} </span>
      <div *ngIf="children">
        <fui-tree-node *ngFor="let n of children" [node]="n"></fui-tree-node>
      </div>
    </div>
  `,
})
export class FuiTreeNodeComponent implements OnInit {
  @Input() node: BasicTreeNode<any>;

  hasChildren: boolean = false;
  loadingChildren: boolean = false;
  children: BasicTreeNode<any>[];
  level: number = 0;

  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>>;

  constructor() {
    this.onNodeEvent = new EventEmitter<TreeViewEvent<any>>();
  }

  ngOnInit(): void {
    this.node.hasChildren().then(yesOrNo => {
      this.hasChildren = yesOrNo;
    });
    let parentNode = this.node.getParentNode();
    while (parentNode != null) {
      parentNode = parentNode.getParentNode();
      this.level += 1;
    }
    console.log(this.level);
  }

  expand(): void {
    console.log('expand node');
    this.onNodeEvent.emit({
      getNode: () => {
        return this.node as TreeNode<any>;
      },
      getType: () => {
        return TreeViewEventType.NODE_EXPANDED;
      },
    });
    this.loadingChildren = true;
    this.node.getChildNodes().then(childs => {
      this.children = childs as BasicTreeNode<any>[];
      this.loadingChildren = false;
    });
  }
}
