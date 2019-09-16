import { Component, Input, OnInit, Output, EventEmitter, ViewChildren, QueryList } from '@angular/core';
import { BasicTreeNode } from './basic-tree-node';
import { TreeViewEvent, TreeViewEventType, TreeNode } from './interfaces';

@Component({
  selector: 'fui-tree-node',
  template: `
    <div [style.padding-left.px]="level * 10">
      <span *ngIf="hasChildren" (click)="expand()">
        <span *ngIf="!isExpanded"> + </span>
        <span *ngIf="isExpanded"> - </span>
      </span>
      <span [style.color]="isSelected ? 'red' : 'black'" (click)="onSelected()">
        {{ node.getData().data[node.getLabel()] }}
      </span>
      <div *ngIf="children">
        <fui-tree-node *ngFor="let n of children" [node]="n" (onNodeEvent)="nodeEvent($event)"></fui-tree-node>
      </div>
    </div>
  `,
})
export class FuiTreeNodeComponent implements OnInit {
  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>>;

  @Input() node: BasicTreeNode<any>;

  @ViewChildren(FuiTreeNodeComponent) childrenNodeComponents: QueryList<FuiTreeNodeComponent>;

  hasChildren: boolean = false;
  loadingChildren: boolean = false;
  children: BasicTreeNode<any>[];
  level: number = 0;
  isExpanded: boolean = false;
  isSelected: boolean = false;

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
  }

  expand(): void {
    console.log('expand node');
    this.isExpanded = !this.isExpanded;
    this.onNodeEvent.emit({
      getNode: () => {
        return this.node as TreeNode<any>;
      },
      getType: () => {
        return this.isExpanded ? TreeViewEventType.NODE_EXPANDED : TreeViewEventType.NODE_COLLAPSED;
      },
    });
    if (this.isExpanded) {
      this.loadingChildren = true;
      this.node.getChildNodes().then(childs => {
        this.children = childs as BasicTreeNode<any>[];
        this.loadingChildren = false;
      });
    } else {
      this.children = undefined;
    }
  }

  onSelected(): void {
    console.log('select node');
    this.isSelected = !this.isSelected;
    this.onNodeEvent.emit({
      getNode: () => {
        return this.node as TreeNode<any>;
      },
      getType: () => {
        return TreeViewEventType.NODE_CLICKED;
      },
    });
  }

  nodeEvent(event: TreeViewEvent<any>): void {
    this.onNodeEvent.emit(event);
  }
}

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

  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>> = new EventEmitter<TreeViewEvent<any>>();

  @ViewChildren(FuiTreeNodeComponent) children: QueryList<FuiTreeNodeComponent>;

  constructor() {}

  nodeEvent(event: TreeViewEvent<any>): void {
    //console.log(event.getType(), event.getNode(), this.rootNode);
    this.onNodeEvent.emit(event);
    //console.log(this.children);
    this.children.forEach(it => {
      console.log(it);
      if (it.hasChildren) {
        console.log(it.childrenNodeComponents);
      }
    });
  }
}
