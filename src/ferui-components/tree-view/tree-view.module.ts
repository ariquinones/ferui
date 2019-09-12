import { NgModule, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FuiTreeViewComponent, FuiTreeNodeComponent } from './tree-view-component';

export const FUI_TREEVIEW_DIRECTIVES: Type<any>[] = [FuiTreeViewComponent, FuiTreeNodeComponent];

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [FUI_TREEVIEW_DIRECTIVES],
  exports: [FUI_TREEVIEW_DIRECTIVES],
})
export class TreeViewModule {}
