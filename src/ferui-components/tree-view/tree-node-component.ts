import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
  TemplateRef,
  HostListener,
  HostBinding,
} from '@angular/core';
import { BasicTreeNode } from './basic-tree-node';
import { TreeViewEvent, TreeViewEventType, TreeNode, FuiTreeNodeComponentStyles, PagingParams } from './interfaces';
import { ServerSideTreeNode } from './paged-tree-node';

@Component({
  selector: 'fui-tree-node',
  template: `
    <div class="fui-tree-node">
      <div
        class="node-tree"
        [style.background-color]="_selected ? styles.selected_background : 'transparent'"
        [ngClass]="{ 'node-tree-selected': _selected }"
        [style.padding-left.px]="level * 10"
      >
        <span *ngIf="hasChildren" (click)="onExpand()">
          <ng-container
            *ngIf="getIconTemplate()"
            class="icon-template"
            [ngTemplateOutlet]="getIconTemplate()"
          ></ng-container>
        </span>
        <span class="label" [style.color]="_selected ? styles.selected_color : 'inherit'" (click)="onSelected()">
          {{ node.getData().data[node.getLabel()] }}
        </span>
      </div>
      <div *ngIf="children">
        <fui-tree-node
          *ngFor="let n of children"
          [node]="n"
          [selected]="false"
          [expanded]="false"
          (onNodeEvent)="nodeEvent($event)"
          [pagingParams]="pagingParams"
          [styles]="styles"
        ></fui-tree-node>
        <div
          *ngIf="_numberOfChildrenExpected > children.length && !loadingChildren && !loadError"
          (click)="viewMore()"
          [style.margin-left.px]="level * 10 + 10"
          class="view-more"
        >
          View More
        </div>
      </div>
      <div [style.margin-left.px]="level * 10 + 10">
        <clr-icon
          *ngIf="loadingChildren"
          class="fui-datagrid-loading-icon fui-loader-animation"
          shape="fui-spinner"
        ></clr-icon>
        <clr-icon
          *ngIf="loadError && !loadingChildren"
          class="fui-error-icon"
          shape="fui-error"
          aria-hidden="true"
        ></clr-icon>
        <span *ngIf="loadError && !loadingChildren" class="error-msg">Couldn't load content</span>
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
        margin-right: 10px;
      }
      .view-more {
        text-decoration: underline;
        font-size: 12px;
        cursor: pointer;
      }
      .error-msg {
        padding-left: 10px;
      }
    `,
  ],
})
export class FuiTreeNodeComponent implements OnInit {
  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>> = new EventEmitter<TreeViewEvent<any>>();

  @Input() node: TreeNode<any>;

  @Input() styles: FuiTreeNodeComponentStyles;

  @Input() pagingParams?: PagingParams | null;

  @ViewChildren(FuiTreeNodeComponent) childrenNodeComponents: QueryList<FuiTreeNodeComponent>;

  hasChildren: boolean = false;
  loadingChildren: boolean = false;
  loadError: boolean = false;
  children: TreeNode<any>[];
  level: number = 0;
  _pagingParams: PagingParams;
  _numberOfChildrenExpected: number;
  _expanded: boolean;
  _selected: boolean;

  constructor() {}

  ngOnInit(): void {
    if (this.pagingParams) {
      // Deep clone initial params so that each child node starts at the original offset and limit
      this._pagingParams = JSON.parse(JSON.stringify(this.pagingParams));
    }
    // We check to see if the host Tree Node has any children we could load
    this.node.hasChildren().then((hasChildren: boolean) => {
      this.hasChildren = hasChildren;
      if (this.pagingParams && this.hasChildren) {
        // Get number of children expected from Server Side Node
        (this.node as ServerSideTreeNode<any>).getNumberOfChildren().then(numberOfChildren => {
          this._numberOfChildrenExpected = numberOfChildren;
        });
      }
    });
    // We get the hierarchical level based on how many parents the host Tree Node has
    let parentNode = this.node.getParentNode();
    while (parentNode != null) {
      parentNode = parentNode.getParentNode();
      this.level += 1;
    }
  }

  @Input()
  set selected(select: boolean) {
    this._selected = select;
  }

  @Input()
  set expanded(expand: boolean) {
    this._expanded = expand;
    if (this._expanded) {
      this.loadingChildren = true;
      if (this.node instanceof ServerSideTreeNode) {
        const node = this.node as ServerSideTreeNode<any>;
        node.getPagedChildNodes(this._pagingParams).then(
          arrayOfPagedTreeNodes => {
            this._pagingParams.offset += arrayOfPagedTreeNodes.length;
            this.children = arrayOfPagedTreeNodes;
            this.loadingChildren = false;
          },
          () => {
            this.loadError = true;
            this.loadingChildren = false;
          }
        );
      } else {
        this.node.getChildNodes().then(childs => {
          this.children = childs as BasicTreeNode<any>[];
          this.loadingChildren = false;
        });
      }
    } else {
      this.children = undefined;
      if (this._pagingParams) {
        // reset if Server Side Node
        this._pagingParams = this.pagingParams;
        this.loadError = false;
      }
    }
  }

  viewMore(): void {
    this.loadingChildren = true;
    (this.node as ServerSideTreeNode<any>).getPagedChildNodes(this._pagingParams).then(
      children => {
        this._pagingParams.offset += children.length;
        this.children.push(...children);
        // Ask Mathieu how a new loader should show up on view more...
        this.loadingChildren = false;
      },
      () => {
        this.loadError = true;
        this.loadingChildren = false;
      }
    );
  }

  /**
   * Invokes the node event based on the host Tree Node and its expanded or collapsed state
   */
  onExpand(): void {
    this.onNodeEvent.emit({
      getNode: () => {
        return this.node as TreeNode<any>;
      },
      getType: () => {
        return !this._expanded ? TreeViewEventType.NODE_EXPANDED : TreeViewEventType.NODE_COLLAPSED;
      },
    });
  }

  /**
   * Invokes the node event based on the host Tree Node click event
   */
  onSelected(): void {
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
