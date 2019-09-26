import { Component, Input, OnInit, Output, EventEmitter, ViewChildren, QueryList } from '@angular/core';
import { BasicTreeNode } from './basic-tree-node';
import {
  TreeViewEvent,
  TreeViewEventType,
  TreeNode,
  TreeViewConfiguration,
  PagingParams,
  FuiTreeViewStyles,
} from './interfaces';
import { Observable } from 'rxjs/index';
import { ServerSideTreeNode } from './paged-tree-node';
import { FuiTreeNodeComponent } from './tree-node-component';

@Component({
  selector: 'fui-tree-view',
  template: `
    <div id="fui-tree-view-component" [ngStyle]="treeViewStyles.treeViewStyles">
      <div *ngIf="hasRoot">
        <fui-tree-node
          [node]="rootNode"
          [selected]="false"
          [expanded]="false"
          (onNodeEvent)="nodeEvent($event)"
          [pagingParams]="pagingParams"
          [styles]="treeViewStyles.nodeStyles"
        ></fui-tree-node>
      </div>
      <div *ngIf="!hasRoot">
        <fui-tree-node
          *ngFor="let n of rootChildren"
          [node]="n"
          [selected]="false"
          [expanded]="false"
          (onNodeEvent)="nodeEvent($event)"
          [pagingParams]="pagingParams"
          [styles]="treeViewStyles.nodeStyles"
        ></fui-tree-node>
      </div>
    </div>
  `,
  styles: [
    `
      #fui-tree-view-component {
        padding: 10px;
        overflow: auto;
        margin: 10px;
      }
    `,
  ],
})
export class FuiTreeViewComponent implements OnInit {
  @Input() rootNode: TreeNode<any>;

  @Input() config: TreeViewConfiguration;

  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>> = new EventEmitter<TreeViewEvent<any>>();

  @ViewChildren(FuiTreeNodeComponent) children: QueryList<FuiTreeNodeComponent>;

  hasRoot: boolean = true;
  rootChildren: BasicTreeNode<any>[] | null;
  treeViewStyles: FuiTreeViewStyles;
  pagingParams: PagingParams | null = null;

  constructor() {}

  ngOnInit(): void {
    if (this.rootNode instanceof ServerSideTreeNode) {
      // We set the initial paging params if node is a Server Side node
      this.pagingParams = { offset: 0, limit: this.rootNode.getData().limit || 10 };
    }
    this.treeViewStyles = this.getComponentStyles();
  }

  /**
   * Gets the Event Observable an outside service can subscribe to and listen to any Tree Node event
   * @returns {Observable<TreeViewEvent<any>>}
   */
  public getEventObservable(): Observable<TreeViewEvent<any>> {
    return this.onNodeEvent;
  }

  /**
   * Public method to use from outside the FuiTreeViewComponent to select a tree node
   * @param {TreeNode<any>} node
   */
  public selectNode(node: TreeNode<any>): void {
    this.selectOneNode(this.children, node);
  }

  /**
   * Public method to use from outside the FuiTreeViewComponent to toggle the expandsion of tree node
   * @param {TreeNode<any>} node
   */
  public toggleExpandNode(node: TreeNode<any>): void {
    this.toggleExpandOneNode(this.children, node);
  }

  /**
   * Emits the Node Event for outside Tree View Component usage as well as ensures tree nodes properties are updated
   * @param {TreeViewEvent<any>} event
   */
  private nodeEvent(event: TreeViewEvent<any>): void {
    this.onNodeEvent.emit(event);
    switch (event.getType()) {
      case TreeViewEventType.NODE_EXPANDED:
      case TreeViewEventType.NODE_COLLAPSED:
        this.toggleExpandOneNode(this.children, event.getNode());
        break;
      case TreeViewEventType.NODE_CLICKED:
        this.selectOneNode(this.children, event.getNode());
        break;
      default:
        break;
    }
  }

  /**
   * Selects a TreeNode and deselects all other on the entire Tree View
   * @param {QueryList<FuiTreeNodeComponent>} children
   * @param {TreeNode<any>} node
   */
  private selectOneNode(children: QueryList<FuiTreeNodeComponent>, node: TreeNode<any>) {
    children.forEach(it => {
      it.selected = node === it.node;
      if (!!it.childrenNodeComponents && it.childrenNodeComponents.length > 0) {
        this.selectOneNode(it.childrenNodeComponents, node);
      }
    });
  }

  /**
   * Toggles the expanded property of the chosen TreeNode Component and ensures no other TreeNode is expanded as well.
   * @param {QueryList<FuiTreeNodeComponent>} children
   * @param {TreeNode<any>} node
   */
  private toggleExpandOneNode(children: QueryList<FuiTreeNodeComponent>, node: TreeNode<any>): void {
    children.forEach(it => {
      if (node === it.node) {
        it.expanded = !it._expanded;
      }
      if (!!it.childrenNodeComponents && it.childrenNodeComponents.length > 0) {
        this.toggleExpandOneNode(it.childrenNodeComponents, node);
      }
    });
  }

  /**
   * Based on the configuration object of the component we check to see if the developer specified a default color
   * scheme or if they provided one of their own. Otherwise we choose our WHITE default color scheme
   */
  private getComponentStyles(): FuiTreeViewStyles {
    // Default WHITE color scheme
    let backgroundColor = '#F5F8F9';
    let textColor = '#252A3A';
    let hoverColor = '#FFF';
    let selectTextColor = '#FFF';
    let selectBackgroundColor = '#03A6FF';
    if (this.config.colorVariation) {
      switch (this.config.colorVariation) {
        case 'DARK_BLUE':
          backgroundColor = '#252A3A';
          textColor = '#FFF';
          hoverColor = '#353F4E';
          selectTextColor = '#FFF';
          selectBackgroundColor = '#03A6FF';
          break;
        case 'LIGHT_BLUE':
          backgroundColor = '#03A6FF';
          textColor = '#FFF';
          hoverColor = '#0295E6';
          selectTextColor = '#252A3A';
          selectBackgroundColor = '#FFF';
          break;
        default:
          break;
      }
    } else if (this.config.colorConfiguration) {
      backgroundColor = this.config.colorConfiguration.backgroundColor;
      textColor = this.config.colorConfiguration.textColor;
      hoverColor = this.config.colorConfiguration.nodeEventColor.backgroundHoverColor;
      selectTextColor = this.config.colorConfiguration.nodeEventColor.textSelectColor;
      selectBackgroundColor = this.config.colorConfiguration.nodeEventColor.backgroundSelectColor;
    }
    return {
      treeViewStyles: {
        background: backgroundColor,
        color: textColor,
        width: this.config.width ? this.config.width : 'auto',
        height: this.config.height ? this.config.height : '200px',
      },
      nodeStyles: {
        hover: hoverColor,
        selected_background: selectBackgroundColor,
        selected_color: selectTextColor,
      },
    };
  }
}
