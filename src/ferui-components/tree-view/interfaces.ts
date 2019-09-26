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
  limit?: number;
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
  // Color config lets the developer choose the entire color combo for the Tree View component.
  // It accepts standard CSS color values such as hex values, color names, and rgb. Else we pick a default variation
  colorConfiguration?: TreeViewColorConfiguration;
  colorVariation?: TreeViewColorVariation;
}

export type TreeViewColorVariation = 'DARK_BLUE' | 'LIGHT_BLUE' | 'WHITE';

export interface TreeViewColorConfiguration {
  backgroundColor: string;
  textColor: string;
  nodeEventColor: NodeEventColor;
}

export interface NodeEventColor {
  backgroundHoverColor: string;
  backgroundSelectColor: string;
  textSelectColor: string;
}

export interface FuiTreeViewStyles {
  treeViewStyles: FuiTreeViewComponentStyles;
  nodeStyles: FuiTreeNodeComponentStyles;
}

export interface FuiTreeViewComponentStyles {
  background: string;
  color: string;
  width: string;
  height: string;
}

export interface FuiTreeNodeComponentStyles {
  hover: string;
  selected_background: string;
  selected_color: string;
}
