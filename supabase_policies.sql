-- RLS Policies for Omniglot Wrapper
-- These policies allow anonymous access for development
-- In production, you should restrict these based on user authentication

-- Agents table policies
CREATE POLICY "Allow anonymous read access on agents" ON agents
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access on agents" ON agents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access on agents" ON agents
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access on agents" ON agents
  FOR DELETE USING (true);

-- Glossary table policies
CREATE POLICY "Allow anonymous read access on glossary" ON glossary
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access on glossary" ON glossary
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access on glossary" ON glossary
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access on glossary" ON glossary
  FOR DELETE USING (true);

-- Datasets table policies
CREATE POLICY "Allow anonymous read access on datasets" ON datasets
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access on datasets" ON datasets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access on datasets" ON datasets
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access on datasets" ON datasets
  FOR DELETE USING (true);

-- Jobs table policies
CREATE POLICY "Allow anonymous read access on jobs" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access on jobs" ON jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access on jobs" ON jobs
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access on jobs" ON jobs
  FOR DELETE USING (true); 