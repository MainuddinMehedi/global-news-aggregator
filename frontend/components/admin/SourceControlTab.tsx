"use client";

import { useState } from "react";
import SourceControlStrip from "./sources/SourceControlStrip";
import FeedSourceTable from "./sources/FeedSourceTable";
import AddEditFeedModal from "./sources/AddEditFeedModal";

interface SourceControlTabProps {
  feedSources: any[];
}

export default function SourceControlTab({ feedSources }: SourceControlTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<any | null>(null);

  const handleAddClick = () => {
    setEditingSource(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (source: any) => {
    setEditingSource(source);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <SourceControlStrip onAddClick={handleAddClick} />
      <FeedSourceTable feedSources={feedSources} onEditClick={handleEditClick} />
      <AddEditFeedModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        source={editingSource}
      />
    </div>
  );
}
