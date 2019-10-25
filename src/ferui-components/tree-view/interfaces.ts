import { TemplateRef } from '@angular/core';

export interface TreeNode<T> {
  getData(): TreeNodeData<T>;
  getLabel(): string;
  hasChildren(): Promise<boolean>;
  getChildNodes(): Promise<Array<TreeNode<T>>>;
  hasParent(): boolean;
  getParentNode(): TreeNode<T> | null;
  getIcon(isNodeExpanded: boolean, isNodeSelected: boolean): TemplateRef<any> | null;
}

export interface TreeNodeDataRetriever<T> {
  hasChildNodes(parent: TreeNode<T>): Promise<boolean>;
  getChildNodeData(parent: TreeNode<T>): Promise<Array<TreeNodeData<T>>>;
  // based on the current TreeNode and its status, we allow the developer to give us an icon template
  // Cannot be part of any configuration or ng-content because it would only allow the dev to give us a limit amount
  // of icon settings and with this we allow for any icon they could possibly want at any moment
  getIconTemplate(treeNode: TreeNode<T>, isExpanded: boolean, isSelected: boolean): TemplateRef<any> | null;
}

export interface PagingParams {
  offset: number;
  limit: number;
}

export interface PagedTreeNode<T> extends TreeNode<T> {
  getPagedChildNodes(pagingParams: PagingParams): Promise<Array<PagedTreeNode<T>>>;
  getPagedParentNode(): PagedTreeNode<T> | null;
}

export interface PagedTreeNodeDataRetriever<T> extends TreeNodeDataRetriever<T> {
  getPagedChildNodeData(parent: PagedTreeNode<T> | null, pagingParams: PagingParams): Promise<Array<TreeNodeData<T>>>;
  getNumberOfChildNodes(parent: PagedTreeNode<T>): Promise<number>;
  hasChildNodes(parent: PagedTreeNode<T>): Promise<boolean>;
}

export interface TreeNodeData<T> {
  data: T;
  label: string;
  childrenLabel?: string;
}

export interface TreeViewEvent<T> {
  getNode(): TreeNode<T>;
  getType(): TreeViewEventType;
}

export enum TreeViewEventType {
  NODE_CLICKED,
  NODE_EXPANDED,
  NODE_COLLAPSED,
}

export interface TreeViewConfiguration {
  width?: string;
  height?: string;
  hasBorders?: boolean;
  // Color config lets the developer choose the entire color combo for the Tree View component based on 3 given themes
  colorVariation?: TreeViewColorTheme;
}

export type TreeViewColorTheme = 'DARK_BLUE' | 'LIGHT_BLUE' | 'WHITE';

export interface FuiTreeViewComponentStyles {
  width: string;
  height: string;
}
