import { ReactNode } from "react";
import styles from "./AssessmentWorkspaceShell.module.css";

type AssessmentWorkspaceShellProps = {
  children: ReactNode;
  panel: ReactNode;
};

const AssessmentWorkspaceShell = ({
  children,
  panel,
}: AssessmentWorkspaceShellProps) => (
  <div className={styles.layout}>
    <div className={styles.main}>{children}</div>
    <aside className={styles.side}>
      <div className={styles.sideInner}>{panel}</div>
    </aside>
  </div>
);

export default AssessmentWorkspaceShell;
