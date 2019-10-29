import { Component, Input, OnInit, Output, EventEmitter, TemplateRef, ViewContainerRef } from '@angular/core';
import { TreeViewEvent, TreeViewEventType, TreeNode, PagingParams, TreeViewColorTheme } from './interfaces';
import { ServerSideTreeNode } from './paged-tree-node';

@Component({
  selector: 'fui-tree-node',
  template: `
    <div class="fui-tree-node" [ngClass]="theme">
      <div
        class="node-tree"
        (click)="onSelected()"
        [ngClass]="{ 'node-tree-selected': _selected }"
        [style.padding-left.px]="calculatePadding()"
      >
        <span *ngIf="hasChildren" class="icon-template" (click)="onExpand()">
          <ng-container *ngIf="getIconTemplate()" [ngTemplateOutlet]="getIconTemplate()"></ng-container>
        </span>
        <span class="label">
          {{ node.getData().data[node.getLabel()] }}
        </span>
      </div>
      <div [style.margin-left.px]="calculatePadding() + 20">
        <clr-icon *ngIf="showLoader" class="fui-datagrid-loading-icon fui-loader-animation" shape="fui-spinner"></clr-icon>
        <clr-icon *ngIf="loadError" class="fui-error-icon" shape="fui-error" aria-hidden="true"></clr-icon>
        <span *ngIf="loadError" class="error-msg">Couldn't load content</span>
      </div>
    </div>
  `,
  styles: [
    `
      .node-tree {
        height: 34px;
        border-radius: 3px;
        cursor: pointer;
      }
      .label {
        line-height: 34px;
        font-size: 14px;
      }
      .node-tree-selected {
        box-shadow: 0 4px 6px 0 rgba(54, 71, 82, 0.12);
      }
      .icon-template {
        margin-right: 5px;
      }
      .fui-error-icon {
        height: 14px;
        width: 14px;
      }
      .error-msg {
        padding-left: 5px;
        font-size: 12px;
        vertical-align: bottom;
      }
      .DARK_BLUE .node-tree:not(.node-tree-selected):hover {
        background: #353f4e;
      }
      .DARK_BLUE .node-tree-selected {
        color: #fff;
        background: #03a6ff;
      }
      .LIGHT_BLUE .node-tree:not(.node-tree-selected):hover {
        background: #0295e6;
      }
      .LIGHT_BLUE .node-tree-selected {
        color: #252a3a;
        background: #fff;
      }
      .WHITE .node-tree:not(.node-tree-selected):hover {
        background: #fff;
      }
      .WHITE .node-tree-selected {
        color: #fff;
        background: #03a6ff;
      }
    `,
  ],
})
export class FuiTreeNodeComponent implements OnInit {
  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>> = new EventEmitter<TreeViewEvent<any>>();

  @Input() node: TreeNode<any>;

  @Input() pagingParams?: PagingParams | null;

  @Input() theme: TreeViewColorTheme | null;

  @Input() flattenData: any;

  @Input() showLoader: boolean = false;

  hasChildren: boolean = false;
  loadError: boolean = false;
  level: number = 0;
  _pagingParams: PagingParams;
  _numberOfChildrenExpected: number;
  _expanded: boolean;
  _selected: boolean;

  constructor(public vcr: ViewContainerRef) {}

  ngOnInit(): void {
    if (this.pagingParams) {
      // Deep clone initial params so that each child node starts at the original offset and limit
      this._pagingParams = JSON.parse(JSON.stringify(this.pagingParams));
      this.flattenData._pagingParams = this._pagingParams;
    }
    // We check to see if the Tree Node has any children we could load
    this.node.hasChildren().then((hasChildren: boolean) => {
      this.hasChildren = hasChildren;
      if (this.pagingParams && this.hasChildren) {
        // Get number of children expected from Server Side Node
        (this.node as ServerSideTreeNode<any>).getNumberOfChildren().then(numberOfChildren => {
          this._numberOfChildrenExpected = numberOfChildren;
          this.flattenData._numberOfChildrenExpected = this._numberOfChildrenExpected;
        });
      }
    });
    this.level = this.node.getData().data.fui_level;
  }

  @Input()
  set selected(select: boolean) {
    this._selected = select;
    this.flattenData.selected = this._selected;
  }

  @Input()
  set expanded(expand: boolean) {
    this._expanded = expand;
    this.flattenData.expanded = this._expanded;
  }

  setLoadingError(error: boolean): void {
    this.loadError = error;
  }

  calculatePadding(): number {
    return this.hasChildren ? this.level * 20 + 10 : this.level * 20 + 30;
  }

  /**
   * Invokes the node event based on the host Tree Node and its expanded or collapsed state
   */
  onExpand(): void {
    this._expanded = !this._expanded;
    this.flattenData.expanded = this._expanded;
    if (!this._expanded) {
      this.loadError = false;
    }
    this.onNodeEvent.emit({
      getNode: () => {
        return this.node as TreeNode<any>;
      },
      getType: () => {
        return this._expanded ? TreeViewEventType.NODE_EXPANDED : TreeViewEventType.NODE_COLLAPSED;
      },
    });
  }

  /**
   * Invokes the node event based on the host Tree Node click event
   */
  onSelected(): void {
    this._selected = true;
    this.flattenData.selected = this._selected;
    this.onNodeEvent.emit({
      getNode: () => {
        return this.node as TreeNode<any>;
      },
      getType: () => {
        return TreeViewEventType.NODE_CLICKED;
      },
    });
  }

  /**
   * Emits the expanded and selected Tree Node events
   * @param {TreeViewEvent<any>} event
   */
  nodeEvent(event: TreeViewEvent<any>): void {
    this.onNodeEvent.emit(event);
  }

  /**
   * Gets the icon template reference the developer can use on a Tree Node with its current state
   * @returns {TemplateRef<any> | null}
   */
  getIconTemplate(): TemplateRef<any> | null {
    return this.node.getIcon(this._expanded, this._selected);
  }
}
