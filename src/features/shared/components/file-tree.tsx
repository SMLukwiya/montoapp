import {
  ArrowRightSquare,
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  MinusSquare,
  PlusSquare,
  SquareDot,
} from "lucide-react";
import { useState } from "react";

type Files = {
  path: string;
  changeType: string;
}[];

type TreeNode = {
  type: "file" | "directory";
  path?: string;
  changeType?: string;
  children?: { [key: string]: TreeNode };
};
type TreeNodeItemProps = {
  node: TreeNode;
  name: string;
  depth: number;
};

function TreeNodeItem({ node, name, depth }: TreeNodeItemProps) {
  const [isOpen, setIsOpen] = useState(true);

  const getChangeTypeIcon = (changeType: string) => {
    const changeTypeIcon = {
      MODIFIED: <SquareDot className="h-3 w-3 text-amber-500" />,
      ADDED: <PlusSquare className="h-3 w-3 text-green-500" />,
      RENAMED: <ArrowRightSquare className="h-3 w-3 text-slate-500" />,
      REMOVED: <MinusSquare className="h-3 w-3 text-red-600" />,
    };

    switch (changeType) {
      case "MODIFIED":
        return changeTypeIcon.MODIFIED;
      case "ADDED":
        return changeTypeIcon.ADDED;
      case "RENAMED":
        return changeTypeIcon.RENAMED;
      case "REMOVED":
        return changeTypeIcon.REMOVED;
      default:
        return null;
    }
  };

  const indentDivs = [...Array<undefined>(depth)].map((_, i) => {
    return (
      <div
        key={i}
        className={`w-[8px] flex-shrink-0 border-r border-r-slate-200`}
      ></div>
    );
  });

  if (node.type === "file") {
    return (
      <div className="flex">
        {indentDivs}
        <div className="ml-0.5 flex min-w-0 flex-grow cursor-pointer items-center gap-1 rounded p-1 text-xs hover:bg-slate-100">
          <File className="h-3 w-3 flex-shrink-0 text-slate-600" />
          <a
            href={`#${node.path ?? ""}`}
            className="max-w-[140px] flex-grow truncate"
          >
            {name}
          </a>
          <div className="flex-shrink-0">
            {getChangeTypeIcon(node.changeType ?? "")}
          </div>
        </div>
      </div>
    );
  } else {
    // Directory node
    return (
      <div>
        <div className="flex">
          {indentDivs}
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="flex min-w-0 flex-grow cursor-pointer items-center gap-1 rounded px-0.5 text-xs hover:bg-slate-100"
          >
            <>
              {isOpen ? (
                <ChevronDown className="h3 w-3 flex-shrink-0 text-slate-500" />
              ) : (
                <ChevronRight className="h3 w-3 flex-shrink-0 text-slate-500" />
              )}
            </>
            <Folder className="h-3 w-3 flex-shrink-0 text-blue-600" />
            <div className="max-w-[140px] flex-grow truncate">{name}</div>
          </div>
        </div>

        {isOpen &&
          Object.entries(node.children ?? {}).map(([childName, childNode]) => (
            <TreeNodeItem
              key={childName}
              node={childNode}
              name={childName}
              depth={depth + 1}
            />
          ))}
      </div>
    );
  }
}

export default function FileTree({ files }: { files: Files }) {
  const fileTree = createFileTree(files);

  return (
    <div>
      {Object.entries(fileTree.children ?? {}).map(([name, node]) => (
        <TreeNodeItem key={name} node={node} name={name} depth={0} />
      ))}
    </div>
  );
}

function createFileTree(files: Files) {
  const fileTree: TreeNode = { type: "directory", children: {} };

  files.forEach((file) => {
    const pathParts = file.path.split("/");
    let currentNode: TreeNode = fileTree;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];

      // Skip empty parts (e.g. the first part when path starts with "/"
      if (!part) continue;

      // If we're at a file (the end of the path), add it to the tree
      if (i === pathParts.length - 1) {
        currentNode.children = {
          ...currentNode.children,
          [part]: {
            type: "file",
            changeType: file.changeType,
            path: file.path,
          },
        };
      }

      // If we're at a directory, add it to the tree if it doesn't already exist
      else {
        if (!currentNode.children || !currentNode.children[part]) {
          currentNode.children = {
            ...currentNode.children,
            [part]: {
              type: "directory",
              children: {},
            },
          };
        }

        const nextNode = currentNode.children[part];
        if (!nextNode) throw new Error("nextNode is undefined");

        currentNode = nextNode;
      }
    }
  });

  return fileTree;
}
