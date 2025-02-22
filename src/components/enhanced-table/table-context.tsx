"use client"

import type { Table } from "@tanstack/react-table"
import type React from "react"
import { createContext, useContext } from "react"

interface TableContextProps {
  table: Table<any>
  updateData: (rowIndex: number, updatedData: any) => void
  enableEditing?: boolean
  enableColumnReorder?: boolean
  columnOrder?: string[]
}

const TableContext = createContext<TableContextProps | undefined>(undefined)

export const useTableContext = () => {
  const context = useContext(TableContext)
  if (!context) {
    throw new Error("useTableContext must be used within a TableProvider")
  }
  return context
}

export const TableProvider: React.FC<{
  table: Table<any>
  updateData: (rowIndex: number, updatedData: any) => void
  enableEditing?: boolean
  enableColumnReorder?: boolean
  columnOrder?: string[]
  children: React.ReactNode
}> = ({ table, updateData, enableEditing, enableColumnReorder, columnOrder, children }) => {
  return (
    <TableContext.Provider value={{ table, updateData, enableEditing, enableColumnReorder, columnOrder }}>
      {children}
    </TableContext.Provider>
  )
}
