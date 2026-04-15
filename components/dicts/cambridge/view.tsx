import SpeakerButton from '@/components/ui/SpeakerButton';

import type {
  CambridgeDefinition,
  CambridgeEntry,
  CambridgeExample,
  CambridgeResult,
  CambridgeSenseGroup,
} from './types';
import './view.scss';

export function ResultsView({ data }: { data: unknown[] }) {
  return (
    <>
      {(data as CambridgeResult[]).map((result, index) => (
        <CambridgeResultView key={index} result={result} />
      ))}
    </>
  );
}

function CambridgeResultView({ result }: { result: CambridgeResult }) {
  return (
    <div className="cambridge-result">
      {result.entries.map((entry, index) => (
        <CambridgeEntryView key={`${entry.word}-${entry.pos}-${index}`} entry={entry} />
      ))}
    </div>
  );
}

function CambridgeEntryView({ entry }: { entry: CambridgeEntry }) {
  return (
    <article className="cambridge-entry">
      <div className="cambridge-entry-header">
        <div>
          <h3 className="cambridge-word">{entry.word}</h3>
          <div className="cambridge-meta">
            {entry.pos && <span className="cambridge-pos">{entry.pos}</span>}
            {entry.prons.map((pron, i) => (
              <span key={i} className="cambridge-pron">
                <span className="cambridge-pron-region">{pron.region}</span>
                <span className="cambridge-pron-ipa">/{pron.ipa}/</span>
                {pron.audioUrl && (
                  <SpeakerButton src={pron.audioUrl} size="icon-sm" />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="cambridge-senses">
        {entry.senseGroups.map((group, i) => (
          <SenseGroupView key={i} group={group} />
        ))}
      </div>
    </article>
  );
}

function SenseGroupView({ group }: { group: CambridgeSenseGroup }) {
  return (
    <div className="cambridge-sense-group">
      {group.guideWord && (
        <div className="cambridge-guide-word">{group.guideWord}</div>
      )}
      {group.definitions.map((def, i) => (
        <DefinitionView key={i} definition={def} index={i + 1} />
      ))}
    </div>
  );
}

function DefinitionView({ definition, index }: { definition: CambridgeDefinition; index: number }) {
  return (
    <div className="cambridge-definition">
      <div className="cambridge-def-header">
        <span className="cambridge-def-index">{index}</span>
        {definition.level && (
          <span className="cambridge-level">{definition.level}</span>
        )}
        {definition.usageLabel && (
          <span className="cambridge-usage-label">{definition.usageLabel}</span>
        )}
        {definition.grammarCode && (
          <span className="cambridge-grammar">{definition.grammarCode}</span>
        )}
      </div>
      <p className="cambridge-def-text">{definition.definition}</p>
      {definition.translation && (
        <p className="cambridge-translation">{definition.translation}</p>
      )}
      {definition.examples.length > 0 && (
        <div className="cambridge-examples">
          {definition.examples.map((ex, i) => (
            <ExampleView key={i} example={ex} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExampleView({ example }: { example: CambridgeExample }) {
  return (
    <div className="cambridge-example">
      <p className="cambridge-example-text">{example.text}</p>
      {example.translation && (
        <p className="cambridge-example-trans">{example.translation}</p>
      )}
    </div>
  );
}
