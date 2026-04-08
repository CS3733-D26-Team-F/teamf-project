import { Title } from "@mantine/core";

export function EmployeesTitle() {
  return (
    <Title
      order={1}
      ta="center"
      fw={700}
      style={{ color: "var(--color-yale-blue)", fontFamily: "Roboto, sans-serif" }}
    >
      Employees
    </Title>
  )
}