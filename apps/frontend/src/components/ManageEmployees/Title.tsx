import { Title } from "@mantine/core";

export function EmployeesTitle() {
  return (
    <Title
      order={1}
      ta="left"
      fw={10000}
      style={{ color: "var(--color-yale-blue)", fontFamily: "Roboto, sans-serif", padding: "28px"}}
    >
      Employees
    </Title>
  )
}